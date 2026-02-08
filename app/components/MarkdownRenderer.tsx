'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import 'highlight.js/styles/github.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-body ${className} max-w-full overflow-hidden`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // 代码块强制不超出容器宽度
          code({ node, inline, className, children, ...props }: any) {
            if (!inline) {
              return (
                <div className="rounded-md overflow-hidden">
                  <code
                    className={`${className} block break-words whitespace-pre-wrap`}
                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                    {...props}
                  >
                    {children}
                  </code>
                </div>
              )
            }
            return (
              <code
                className={`${className} break-all`}
                style={{ wordBreak: 'break-all' }}
                {...props}
              >
                {children}
              </code>
            )
          },
          // 表格使用固定布局，防止溢出
          table({ node, children, ...props }: any) {
            return (
              <div className="overflow-hidden">
                <table
                  className="table-fixed w-full"
                  style={{ tableLayout: 'fixed', wordBreak: 'break-word' }}
                  {...props}
                >
                  {children}
                </table>
              </div>
            )
          },
          // 表格单元格强制换行
          th({ node, children, ...props }: any) {
            return (
              <th
                style={{ wordBreak: 'break-word', maxWidth: '200px' }}
                {...props}
              >
                {children}
              </th>
            )
          },
          td({ node, children, ...props }: any) {
            return (
              <td
                style={{ wordBreak: 'break-word', maxWidth: '200px' }}
                {...props}
              >
                {children}
              </td>
            )
          },
          // 其他文本元素也强制换行
          p({ node, children, ...props }: any) {
            return (
              <p
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                {...props}
              >
                {children}
              </p>
            )
          },
          h1({ node, children, ...props }: any) {
            return (
              <h1
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                {...props}
              >
                {children}
              </h1>
            )
          },
          h2({ node, children, ...props }: any) {
            return (
              <h2
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                {...props}
              >
                {children}
              </h2>
            )
          },
          h3({ node, children, ...props }: any) {
            return (
              <h3
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                {...props}
              >
                {children}
              </h3>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
