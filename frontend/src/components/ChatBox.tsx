import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { create } from 'zustand'
import classNames from 'classnames'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'

type Role = 'user' | 'assistant'

interface Message {
  id: string
  role: Role
  text: string
  structured?: any
}

interface ChatState {
  sessionId?: string
  apiKey?: string
  setSessionId: (id?: string) => void
  setApiKey: (key: string) => void
}

const useChatStore = create<ChatState>((set) => ({
  sessionId: undefined,
  apiKey: localStorage.getItem('API_KEY') || '',
  setSessionId: (id?: string) => set({ sessionId: id }),
  setApiKey: (key: string) => {
    localStorage.setItem('API_KEY', key)
    set({ apiKey: key })
  },
}))

function uid() {
  return Math.random().toString(36).slice(2)
}

export function ChatBox() {
  const { sessionId, setSessionId, apiKey, setApiKey } = useChatStore()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const content = input.trim()
    if (!content) return
    setInput('')
    const newUserMsg: Message = { id: uid(), role: 'user', text: content }
    setMessages((prev) => [...prev, newUserMsg])
    setLoading(true)
    try {
      const resp = await axios.post('/api/chat', { message: content, sessionId }, {
        headers: apiKey ? { 'x-api-key': apiKey } : undefined,
      })
      const data = resp.data
      if (data.sessionId && data.sessionId !== sessionId) setSessionId(data.sessionId)
      const assistantMsg: Message = { id: uid(), role: 'assistant', text: data.output?.text || '', structured: data.output?.structured }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      const msg = err?.response?.data?.error || '请求失败'
      setMessages((prev) => [...prev, { id: uid(), role: 'assistant', text: `错误：${msg}` }])
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">Telecom Anti-Fraud ChatBox</div>
        <div className="controls">
          <input
            placeholder="API_KEY（可留空用于本地开发）"
            value={apiKey || ''}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button onClick={() => setSessionId(undefined)}>新会话</button>
        </div>
      </header>

      <main className="content">
        <div className="messages">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {loading && <div className="bubble assistant">正在生成...</div>}
          <div ref={bottomRef} />
        </div>

        <div className="composer">
          <textarea
            placeholder="输入问题，如：查询号码 +8613800138000 的风险"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={3}
          />
          <button onClick={() => void send()} disabled={loading}>发送</button>
        </div>
      </main>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={classNames('bubble', isUser ? 'user' : 'assistant')}>
      <div className="text">{message.text}</div>
      {!!message.structured && <StructuredRenderer data={message.structured} />}
    </div>
  )
}

function StructuredRenderer({ data }: { data: any }) {
  // Detect structures returned by backend and render appropriately
  if (data?.report) return <RiskReportView identifier={data.identifier} report={data.report} />
  if (data?.series || data?.charts || data?.tables) return <StatsView data={data} />
  if (data?.answer === 'top_connected') return <ListView title="前10个接通号码" items={data.numbers} />
  if (data?.answer === 'routing') return <ListView title="呼叫路由链条" items={data.path} />
  if (data?.answer === 'history') return <HistoryView records={data.records} />
  if (typeof data?.blockRate === 'number' && typeof data?.falsePositiveRate === 'number') return <StrategyView data={data} />
  return <pre className="raw-json">{JSON.stringify(data, null, 2)}</pre>
}

function RiskReportView({ identifier, report }: { identifier: string; report: any }) {
  return (
    <div className="card">
      <div className="card-title">风险研判报告 - {identifier}</div>
      <div className="grid two">
        <div>
          <div>归属地：{report.basic?.region}</div>
          <div>运营商：{report.basic?.operator}</div>
          <div>服务类型：{report.basic?.serviceType}</div>
        </div>
        <div>
          <div>风险等级：{report.riskLevel}</div>
          <div>标签：{(report.labels || []).join('、')}</div>
        </div>
      </div>
      <div className="card-subtitle">欺诈类型</div>
      <table className="table">
        <thead><tr><th>类型</th><th>分数</th><th>置信度</th></tr></thead>
        <tbody>
          {(report.fraudTypes || []).map((f: any, i: number) => (
            <tr key={i}><td>{f.type}</td><td>{(f.score * 100).toFixed(1)}%</td><td>{(f.confidence * 100).toFixed(1)}%</td></tr>
          ))}
        </tbody>
      </table>
      <div className="card-subtitle">处置建议</div>
      <ul>
        {(report.recommendations || []).map((r: string, i: number) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  )
}

function StatsView({ data }: { data: any }) {
  const chart = data.charts?.[0]
  const series = chart?.series?.[0]
  const points = series?.points || []
  const table = data.tables || []
  return (
    <div className="card">
      <div className="card-title">统计分析</div>
      <div>{data.summary}</div>
      <div className="chart">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={points}>
            <Line type="monotone" dataKey="value" stroke="#3b82f6" />
            <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
            <XAxis dataKey="timestamp" hide={false} minTickGap={24} />
            <YAxis />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="card-subtitle">地区汇总</div>
      <table className="table">
        <thead><tr><th>地区</th><th>主流欺诈类型</th><th>告警数</th></tr></thead>
        <tbody>
          {table.map((row: any, i: number) => (
            <tr key={i}><td>{row.region}</td><td>{row.topFraud}</td><td>{row.cases}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ListView({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <ul>
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  )
}

function HistoryView({ records }: { records: Array<{ date: string; type: string; score: number }> }) {
  return (
    <div className="card">
      <div className="card-title">历史风险记录</div>
      <table className="table">
        <thead><tr><th>日期</th><th>类型</th><th>分数</th></tr></thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={i}><td>{r.date}</td><td>{r.type}</td><td>{(r.score * 100).toFixed(1)}%</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StrategyView({ data }: { data: any }) {
  const pieData = useMemo(() => ([
    { name: '阻断', value: Number((data.blockRate * 100).toFixed(1)) },
    { name: '未阻断', value: Number(((1 - data.blockRate) * 100).toFixed(1)) },
  ]), [data])
  const colors = ['#16a34a', '#ef4444']
  return (
    <div className="card">
      <div className="card-title">策略模拟</div>
      <div>号段：{data.prefix}</div>
      <div>阻断率：{(data.blockRate * 100).toFixed(1)}% | 误伤率：{(data.falsePositiveRate * 100).toFixed(1)}%</div>
      <div className="chart-row">
        <ResponsiveContainer width="50%" height={240}>
          <BarChart data={data.hourly}>
            <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="effect" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="50%" height={240}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90}>
              {pieData.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

