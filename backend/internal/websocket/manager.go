/**
 * WebSocket管理器
 * 负责WebSocket连接的管理和实时消息推送
 */

package websocket

import (
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// MessageType 消息类型
type MessageType string

const (
	MessageTypeLog    MessageType = "log"
	MessageTypeStatus MessageType = "status"
	MessageTypeMetric MessageType = "metric"
	MessageTypeError  MessageType = "error"
)

// Message WebSocket消息
type Message struct {
	Type      MessageType `json:"type"`
	Timestamp int64       `json:"timestamp"`
	Data      interface{} `json:"data"`
}

// Client WebSocket客户端
type Client struct {
	ID     string
	Conn   *websocket.Conn
	Send   chan Message
	Topics map[string]bool // 订阅的主题
}

// Manager WebSocket管理器
type Manager struct {
	clients    map[string]*Client
	register   chan *Client
	unregister chan *Client
	broadcast  chan Message
	mutex      sync.RWMutex
	upgrader   websocket.Upgrader
}

// NewManager 创建新的WebSocket管理器
func NewManager() *Manager {
	return &Manager{
		clients:    make(map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Message),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// 在生产环境中应该检查Origin
				return true
			},
		},
	}
}

// Start 启动WebSocket管理器
func (m *Manager) Start() {
	for {
		select {
		case client := <-m.register:
			m.mutex.Lock()
			m.clients[client.ID] = client
			m.mutex.Unlock()
			log.Printf("WebSocket client connected: %s", client.ID)

		case client := <-m.unregister:
			m.mutex.Lock()
			if _, ok := m.clients[client.ID]; ok {
				delete(m.clients, client.ID)
				close(client.Send)
				client.Conn.Close()
			}
			m.mutex.Unlock()
			log.Printf("WebSocket client disconnected: %s", client.ID)

		case message := <-m.broadcast:
			m.mutex.RLock()
			for _, client := range m.clients {
				select {
				case client.Send <- message:
				default:
					// 客户端发送缓冲区已满，断开连接
					delete(m.clients, client.ID)
					close(client.Send)
					client.Conn.Close()
				}
			}
			m.mutex.RUnlock()
		}
	}
}

// HandleConnection 处理WebSocket连接
func (m *Manager) HandleConnection(c *gin.Context) {
	conn, err := m.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	clientID := c.Query("client_id")
	if clientID == "" {
		clientID = generateClientID()
	}

	client := &Client{
		ID:     clientID,
		Conn:   conn,
		Send:   make(chan Message, 256),
		Topics: make(map[string]bool),
	}

	m.register <- client

	// 启动客户端的读写协程
	go m.handleClientWrite(client)
	go m.handleClientRead(client)
}

// handleClientWrite 处理客户端写入
func (m *Manager) handleClientWrite(client *Client) {
	defer func() {
		m.unregister <- client
	}()

	for {
		select {
		case message, ok := <-client.Send:
			if !ok {
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := client.Conn.WriteJSON(message); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}
		}
	}
}

// handleClientRead 处理客户端读取
func (m *Manager) handleClientRead(client *Client) {
	defer func() {
		m.unregister <- client
	}()

	for {
		var msg map[string]interface{}
		err := client.Conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket read error: %v", err)
			}
			break
		}

		// 处理客户端消息（如订阅主题）
		m.handleClientMessage(client, msg)
	}
}

// handleClientMessage 处理客户端消息
func (m *Manager) handleClientMessage(client *Client, msg map[string]interface{}) {
	msgType, ok := msg["type"].(string)
	if !ok {
		return
	}

	switch msgType {
	case "subscribe":
		if topic, ok := msg["topic"].(string); ok {
			client.Topics[topic] = true
			log.Printf("Client %s subscribed to topic: %s", client.ID, topic)
		}
	case "unsubscribe":
		if topic, ok := msg["topic"].(string); ok {
			delete(client.Topics, topic)
			log.Printf("Client %s unsubscribed from topic: %s", client.ID, topic)
		}
	}
}

// BroadcastMessage 广播消息给所有客户端
func (m *Manager) BroadcastMessage(msgType MessageType, data interface{}) {
	message := Message{
		Type:      msgType,
		Timestamp: getCurrentTimestamp(),
		Data:      data,
	}
	
	select {
	case m.broadcast <- message:
	default:
		log.Println("Broadcast channel is full, message dropped")
	}
}

// SendToClient 发送消息给特定客户端
func (m *Manager) SendToClient(clientID string, msgType MessageType, data interface{}) {
	m.mutex.RLock()
	client, exists := m.clients[clientID]
	m.mutex.RUnlock()

	if !exists {
		return
	}

	message := Message{
		Type:      msgType,
		Timestamp: getCurrentTimestamp(),
		Data:      data,
	}

	select {
	case client.Send <- message:
	default:
		log.Printf("Client %s send channel is full, message dropped", clientID)
	}
}

// SendToTopic 发送消息给订阅特定主题的客户端
func (m *Manager) SendToTopic(topic string, msgType MessageType, data interface{}) {
	message := Message{
		Type:      msgType,
		Timestamp: getCurrentTimestamp(),
		Data:      data,
	}

	m.mutex.RLock()
	for _, client := range m.clients {
		if client.Topics[topic] {
			select {
			case client.Send <- message:
			default:
				log.Printf("Client %s send channel is full, message dropped", client.ID)
			}
		}
	}
	m.mutex.RUnlock()
}

// GetConnectedClients 获取连接的客户端数量
func (m *Manager) GetConnectedClients() int {
	m.mutex.RLock()
	defer m.mutex.RUnlock()
	return len(m.clients)
}

// GetClientList 获取客户端列表
func (m *Manager) GetClientList() []string {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	clients := make([]string, 0, len(m.clients))
	for clientID := range m.clients {
		clients = append(clients, clientID)
	}
	return clients
}

// 辅助函数
func generateClientID() string {
	// 简单的客户端ID生成，实际应用中可以使用UUID
	return "client_" + time.Now().Format("20060102150405")
}

func getCurrentTimestamp() int64 {
	return time.Now().Unix() * 1000 // 返回毫秒时间戳
}