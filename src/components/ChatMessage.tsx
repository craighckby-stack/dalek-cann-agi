'use client';

import type { Message } from '@/lib/types';
import { COLORS } from '@/lib/constants';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const timeStr = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (message.role === 'system') {
    return (
      <div className="message-animate flex justify-center py-1">
        <div
          className="px-4 py-2 text-center max-w-md"
          style={{
            background: 'rgba(0, 255, 204, 0.03)',
            border: '1px solid rgba(0, 255, 204, 0.1)',
            borderRadius: '2px',
          }}
        >
          <div
            className="flex items-center justify-center gap-2 mb-1"
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              fontSize: '8px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: COLORS.cyan,
            }}
          >
            <span>◉</span>
            <span>SYSTEM NOTIFICATION</span>
            <span>◉</span>
          </div>
          <p
            style={{
              fontSize: '11px',
              lineHeight: '1.5',
              color: COLORS.cyan,
              fontFamily: 'var(--font-share-tech-mono), monospace',
            }}
          >
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  if (message.role === 'caan') {
    return (
      <div className="message-animate flex justify-start">
        <div className="chat-caan rounded-lg p-3 mr-6 sm:mr-12 max-w-[90%] sm:max-w-[85%]">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 pulse-red"
              style={{ background: COLORS.dalekRed }}
            />
            <span
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: COLORS.dalekRed,
              }}
            >
              DARLEK CANN
            </span>
            <span style={{ fontSize: '8px', color: COLORS.textMuted }}>{timeStr}</span>
          </div>
          <p
            style={{
              fontSize: '13px',
              lineHeight: '1.7',
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-share-tech-mono), monospace',
              color: '#e8e8e8',
            }}
          >
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  // operator
  return (
    <div className="message-animate flex justify-end">
      <div className="chat-operator rounded-lg p-3 ml-6 sm:ml-12 max-w-[90%] sm:max-w-[85%]">
        <div className="flex items-center gap-2 mb-2 justify-end">
          <span style={{ fontSize: '8px', color: COLORS.textMuted }}>{timeStr}</span>
          <span
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: COLORS.gold,
            }}
          >
            OPERATOR
          </span>
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: COLORS.gold }}
          />
        </div>
        <p
          style={{
            fontSize: '13px',
            lineHeight: '1.7',
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-share-tech-mono), monospace',
            color: '#ffffff',
          }}
        >
          {message.content}
        </p>
      </div>
    </div>
  );
}
