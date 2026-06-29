import type { ReactNode } from 'react'
import { Button, Tooltip } from '@heroui/react'
import { CheckCheck } from 'lucide-react'
import * as React from 'react'
import { forwardRef, memo, useMemo } from 'react'
import Copy from '~/components/icons/Copy'
import { cn } from '~/lib/utils/tools'

export interface CopyTextProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  textClassName?: string
  copyText?: any
  children: ReactNode
}

export const CopyText = memo(
  forwardRef<HTMLDivElement, CopyTextProps>((props, forwardedRef) => {
    const { className, textClassName, children, copyText = 'Copy' } = props
    const [copied, setCopied] = React.useState(false)
    const [copyTimeout, setCopyTimeout] = React.useState<ReturnType<typeof setTimeout> | null>(
      null,
    )
    const onClearTimeout = () => {
      if (copyTimeout) {
        clearTimeout(copyTimeout)
      }
    }

    const handleClick = () => {
      onClearTimeout()
      navigator.clipboard.writeText(String(children))
      setCopied(true)

      setCopyTimeout(
        setTimeout(() => {
          setCopied(false)
        }, 3000),
      )
    }

    const content = useMemo(() => (copied ? 'Copied' : copyText), [copied, copyText])

    return (
      <div className={cn('flex items-center gap-1.5', className)} ref={forwardedRef}>
        <div className={textClassName}>{children}</div>
        <Tooltip delay={0}>
          <Button
            className="h-7 w-7 min-w-7 text-muted"
            isIconOnly
            onPress={handleClick}
            size="sm"
            variant="ghost"
          >
            {!copied && <Copy size={14} />}
            {copied && <CheckCheck className="text-success" size={14} />}
          </Button>
          <Tooltip.Content>
            {content}
          </Tooltip.Content>
        </Tooltip>
      </div>
    )
  }),
)

CopyText.displayName = 'CopyText'
