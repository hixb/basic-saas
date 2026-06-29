'use client'

import type { MotionValue } from 'framer-motion'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useMemo, useRef } from 'react'

type FocusState = 'none' | 'email' | 'password'

interface Props {
  focusState: FocusState
}

interface EyeSetProps {
  leftX: number
  rightX: number
  y: number
  leftSocket: number
  rightSocket: number
  leftPupil: number
  rightPupil: number
  pupilDx: MotionValue<number>
  pupilDy: MotionValue<number>
  isEmail: boolean
  isPassword: boolean
  closeScale: number
  delay: number
  leftYOffset?: number
  rightYOffset?: number
  withLids?: boolean
}

interface MascotProps {
  x: number
  y: number
  scale: number
  delay: number
  isIdle: boolean
  isEmail: boolean
  isPassword: boolean
  pupilDx: MotionValue<number>
  pupilDy: MotionValue<number>
  variant: 'calm' | 'silly' | 'shy'
}

const OUTLINE = '#4e446d'
const STROKE = 3.4
const SPRING = { type: 'spring' as const, stiffness: 230, damping: 16, mass: 0.9 }

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}

function transition(delay: number) {
  return { ...SPRING, delay }
}

function EyeSet({
  leftX,
  rightX,
  y,
  leftSocket,
  rightSocket,
  leftPupil,
  rightPupil,
  pupilDx,
  pupilDy,
  isEmail,
  isPassword,
  closeScale,
  delay,
  leftYOffset = 0,
  rightYOffset = 0,
  withLids = false,
}: EyeSetProps) {
  return (
    <motion.g
      animate={{
        scaleX: isEmail ? 1.15 : 1,
        scaleY: isPassword ? closeScale : isEmail ? 1.15 : 1,
      }}
      style={{ transformOrigin: `${(leftX + rightX) / 2}px ${y}px` }}
      transition={transition(delay)}
    >
      <g>
        <ellipse cx={leftX} cy={y + leftYOffset} fill="#fffdfa" rx={leftSocket} ry={leftSocket * 0.95} />
        <motion.g style={{ translateX: pupilDx, translateY: pupilDy }}>
          <ellipse cx={leftX - 0.1} cy={y + leftYOffset + 0.2} fill="#23173d" rx={leftPupil} ry={leftPupil * 1.03} />
          <circle cx={leftX + 2.4} cy={y + leftYOffset - 2.1} fill="white" r={leftPupil * 0.32} />
          <circle cx={leftX + 4.2} cy={y + leftYOffset - 0.8} fill="white" r={leftPupil * 0.14} />
        </motion.g>
      </g>

      <g>
        <ellipse cx={rightX} cy={y + rightYOffset} fill="#fffdfa" rx={rightSocket} ry={rightSocket * 0.95} />
        <motion.g style={{ translateX: pupilDx, translateY: pupilDy }}>
          <ellipse cx={rightX + 0.1} cy={y + rightYOffset + 0.2} fill="#23173d" rx={rightPupil} ry={rightPupil * 1.03} />
          <circle cx={rightX + 2.3} cy={y + rightYOffset - 2.1} fill="white" r={rightPupil * 0.32} />
          <circle cx={rightX + 4.1} cy={y + rightYOffset - 0.8} fill="white" r={rightPupil * 0.14} />
        </motion.g>
      </g>

      {withLids
        ? (
            <motion.g animate={{ opacity: isPassword ? 1 : 0 }} initial={{ opacity: 0 }} transition={transition(delay)}>
              <path d={`M ${leftX - leftSocket + 0.2} ${y - 0.6} Q ${leftX} ${y - 4.2} ${leftX + leftSocket - 0.2} ${y - 0.2}`} fill="none" stroke={OUTLINE} strokeLinecap="round" strokeWidth="2.6" />
              <path d={`M ${rightX - rightSocket + 0.2} ${y - 0.1} Q ${rightX} ${y - 3.9} ${rightX + rightSocket - 0.1} ${y + 0.4}`} fill="none" stroke={OUTLINE} strokeLinecap="round" strokeWidth="2.6" />
            </motion.g>
          )
        : null}
    </motion.g>
  )
}

function Mascot({
  x,
  y,
  scale,
  delay,
  isIdle,
  isEmail,
  isPassword,
  pupilDx,
  pupilDy,
  variant,
}: MascotProps) {
  const floatAnimate = useMemo(() => {
    if (!isIdle) {
      return { y: 0, x: 0 }
    }

    if (variant === 'silly') {
      return { y: [0, -2.8, 0], x: [0, -0.5, 0] }
    }

    if (variant === 'shy') {
      return { y: [0, -1.9, 0], x: [0, -0.4, 0] }
    }

    return { y: [0, -2.2, 0], x: [0, 0.45, 0] }
  }, [isIdle, variant])

  return (
    <motion.g
      animate={floatAnimate}
      transition={isIdle
        ? {
            duration: 3.4,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
            delay,
          }
        : transition(delay)}
    >
      <g transform={`translate(${x} ${y}) scale(${scale}) translate(${-x} ${-y})`}>
        <motion.g
          animate={isIdle ? { scaleX: [1, 0.985, 1], scaleY: [1, 1.02, 1] } : isPassword ? { scaleX: 0.97, scaleY: 1.03 } : { scaleX: 1, scaleY: 1 }}
          style={{ transformOrigin: `${x}px ${y + 30}px` }}
          transition={isIdle
            ? {
                duration: 2.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
                delay,
              }
            : transition(delay)}
        >
          {variant === 'calm'
            ? (
                <>
                  <motion.g
                    animate={isPassword ? { rotate: -8, x: -2 } : { rotate: 0, x: 0 }}
                    style={{ transformOrigin: `${x}px ${y}px` }}
                    transition={transition(delay)}
                  >
                    <path
                      d={`M ${x} ${y - 37} C ${x + 23} ${y - 39} ${x + 39} ${y - 24} ${x + 39} ${y - 2} C ${x + 38} ${y + 20} ${x + 22} ${y + 35} ${x - 1} ${y + 36} C ${x - 22} ${y + 37} ${x - 38} ${y + 22} ${x - 38} ${y} C ${x - 38} ${y - 22} ${x - 24} ${y - 35} ${x} ${y - 37} Z`}
                      fill="url(#gradCalm)"
                      filter="url(#innerSoft)"
                      stroke={OUTLINE}
                      strokeLinejoin="round"
                      strokeWidth={STROKE}
                    />

                    <path
                      d={`M ${x - 3} ${y - 40} L ${x + 1} ${y - 53} L ${x + 8} ${y - 42} L ${x + 3} ${y - 42} L ${x + 6} ${y - 35} Z`}
                      fill="#c4adff"
                      stroke={OUTLINE}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={STROKE}
                    />

                    <path d={`M ${x - 18} ${y - 30} C ${x + 2} ${y - 35} ${x + 18} ${y - 30} ${x + 27} ${y - 16}`} fill="none" opacity="0.33" stroke="white" strokeLinecap="round" strokeWidth="3" />

                    <motion.g animate={{ opacity: isPassword ? 0.78 : 0.52 }} transition={transition(delay)}>
                      <ellipse cx={x - 24} cy={y + 13} fill="#ff89b0" filter="url(#blushBlur)" opacity="0.83" rx="9.5" ry="7" />
                      <ellipse cx={x + 23} cy={y + 14} fill="#ff89b0" filter="url(#blushBlur)" opacity="0.77" rx="8.2" ry="6" />
                    </motion.g>

                    <EyeSet
                      closeScale={0.15}
                      delay={delay}
                      isEmail={isEmail}
                      isPassword={isPassword}
                      leftPupil={6.7}
                      leftSocket={9.4}
                      leftX={x - 13}
                      leftYOffset={-0.6}
                      pupilDx={pupilDx}
                      pupilDy={pupilDy}
                      rightPupil={6.4}
                      rightSocket={8.9}
                      rightX={x + 13}
                      rightYOffset={0.4}
                      withLids
                      y={y + 1}
                    />

                    <motion.path
                      animate={{ opacity: !isEmail && !isPassword ? 1 : 0 }}
                      d={`M ${x - 11} ${y + 19} Q ${x} ${y + 27} ${x + 11} ${y + 20}`}
                      fill="none"
                      stroke="#302557"
                      strokeLinecap="round"
                      strokeWidth="3.2"
                      transition={transition(delay)}
                    />
                    <motion.path
                      animate={{ opacity: isEmail ? 1 : 0 }}
                      d={`M ${x - 15} ${y + 18} Q ${x} ${y + 34} ${x + 15} ${y + 18}`}
                      fill="none"
                      initial={{ opacity: 0 }}
                      stroke="#302557"
                      strokeLinecap="round"
                      strokeWidth="3.4"
                      transition={transition(delay)}
                    />
                    <motion.path
                      animate={{ opacity: isPassword ? 1 : 0 }}
                      d={`M ${x - 12} ${y + 25} Q ${x - 8} ${y + 21} ${x - 4} ${y + 25} Q ${x} ${y + 28} ${x + 4} ${y + 25} Q ${x + 8} ${y + 21} ${x + 12} ${y + 25}`}
                      fill="none"
                      initial={{ opacity: 0 }}
                      stroke="#302557"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      transition={transition(delay)}
                    />
                  </motion.g>

                  <motion.g
                    animate={isPassword ? { rotate: -11, y: -4 } : { rotate: 0, y: 0 }}
                    style={{ transformOrigin: `${x - 20}px ${y + 41}px` }}
                    transition={transition(delay)}
                  >
                    <path
                      d={`M ${x - 19} ${y + 38} C ${x - 28} ${y + 39} ${x - 33} ${y + 47} ${x - 30} ${y + 55} C ${x - 27} ${y + 60} ${x - 20} ${y + 62} ${x - 14} ${y + 59} C ${x - 9} ${y + 56} ${x - 8} ${y + 49} ${x - 10} ${y + 44} C ${x - 12} ${y + 40} ${x - 15} ${y + 38} ${x - 19} ${y + 38} Z`}
                      fill="#bfa8ff"
                      stroke={OUTLINE}
                      strokeLinejoin="round"
                      strokeWidth={STROKE}
                    />
                  </motion.g>
                  <motion.g
                    animate={isPassword ? { rotate: -2, y: -1 } : { rotate: 4, y: 0 }}
                    style={{ transformOrigin: `${x + 20}px ${y + 42}px` }}
                    transition={transition(delay)}
                  >
                    <path
                      d={`M ${x + 19} ${y + 38} C ${x + 27} ${y + 39} ${x + 33} ${y + 46} ${x + 30} ${y + 54} C ${x + 28} ${y + 60} ${x + 20} ${y + 63} ${x + 13} ${y + 60} C ${x + 8} ${y + 57} ${x + 7} ${y + 50} ${x + 9} ${y + 45} C ${x + 11} ${y + 41} ${x + 14} ${y + 38} ${x + 19} ${y + 38} Z`}
                      fill="#bfa8ff"
                      stroke={OUTLINE}
                      strokeLinejoin="round"
                      strokeWidth={STROKE}
                    />
                  </motion.g>

                  <path
                    d={`M ${x - 16} ${y + 48} C ${x - 18} ${y + 58} ${x - 10} ${y + 66} ${x + 1} ${y + 67} C ${x + 14} ${y + 67} ${x + 22} ${y + 60} ${x + 20} ${y + 50} C ${x + 18} ${y + 42} ${x + 10} ${y + 39} ${x} ${y + 39} C ${x - 11} ${y + 39} ${x - 15} ${y + 43} ${x - 16} ${y + 48} Z`}
                    fill="#bba4fb"
                    stroke={OUTLINE}
                    strokeLinejoin="round"
                    strokeWidth={STROKE}
                  />
                </>
              )
            : null}

          {variant === 'silly'
            ? (
                <>
                  <motion.g
                    animate={isPassword ? { rotate: 4 } : { rotate: 0 }}
                    style={{ transformOrigin: `${x}px ${y}px` }}
                    transition={transition(delay)}
                  >
                    <path
                      d={`M ${x} ${y - 48} C ${x + 33} ${y - 51} ${x + 56} ${y - 30} ${x + 55} ${y + 1} C ${x + 54} ${y + 33} ${x + 31} ${y + 54} ${x - 2} ${y + 55} C ${x - 33} ${y + 56} ${x - 56} ${y + 34} ${x - 55} ${y + 3} C ${x - 54} ${y - 28} ${x - 34} ${y - 46} ${x} ${y - 48} Z`}
                      fill="url(#gradSilly)"
                      filter="url(#innerSoft)"
                      stroke={OUTLINE}
                      strokeLinejoin="round"
                      strokeWidth={STROKE}
                    />

                    <path d={`M ${x - 25} ${y - 38} C ${x + 3} ${y - 44} ${x + 30} ${y - 36} ${x + 39} ${y - 21}`} fill="none" opacity="0.32" stroke="white" strokeLinecap="round" strokeWidth="3" />

                    <motion.g animate={{ opacity: isPassword ? 0.82 : 0.5 }} transition={transition(delay)}>
                      <ellipse cx={x - 36} cy={y + 20} fill="#ff88b0" filter="url(#blushBlur)" opacity="0.84" rx="11.5" ry="7.6" />
                      <ellipse cx={x + 37} cy={y + 21.5} fill="#ff88b0" filter="url(#blushBlur)" opacity="0.82" rx="11" ry="7.2" />
                    </motion.g>

                    <EyeSet
                      closeScale={0.12}
                      delay={delay}
                      isEmail={isEmail}
                      isPassword={isPassword}
                      leftPupil={8.6}
                      leftSocket={11.6}
                      leftX={x - 18}
                      leftYOffset={-0.6}
                      pupilDx={pupilDx}
                      pupilDy={pupilDy}
                      rightPupil={8.2}
                      rightSocket={11}
                      rightX={x + 18}
                      rightYOffset={0.8}
                      y={y + 1}
                    />

                    <motion.path
                      animate={{ opacity: !isEmail && !isPassword ? 1 : 0 }}
                      d={`M ${x - 14} ${y + 21} Q ${x} ${y + 38} ${x + 14} ${y + 21}`}
                      fill="none"
                      stroke="#2f2457"
                      strokeLinecap="round"
                      strokeWidth="3.9"
                      transition={transition(delay)}
                    />
                    <motion.path
                      animate={{ opacity: isEmail ? 1 : 0 }}
                      d={`M ${x - 17} ${y + 20} Q ${x} ${y + 44} ${x + 17} ${y + 20}`}
                      fill="none"
                      initial={{ opacity: 0 }}
                      stroke="#2f2457"
                      strokeLinecap="round"
                      strokeWidth="4.1"
                      transition={transition(delay)}
                    />
                    <motion.path
                      animate={{ opacity: isPassword ? 1 : 0 }}
                      d={`M ${x - 14} ${y + 28} Q ${x - 9} ${y + 24} ${x - 4} ${y + 28} Q ${x + 1} ${y + 31} ${x + 6} ${y + 28} Q ${x + 10} ${y + 24} ${x + 14} ${y + 28}`}
                      fill="none"
                      initial={{ opacity: 0 }}
                      stroke="#2f2457"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3.4"
                      transition={transition(delay)}
                    />
                  </motion.g>

                  <motion.g
                    animate={isPassword ? { x: 26, y: -44, rotate: -8 } : { x: 0, y: 0, rotate: 0 }}
                    style={{ transformOrigin: `${x - 33}px ${y + 58}px` }}
                    transition={transition(delay)}
                  >
                    <path
                      d={`M ${x - 34} ${y + 45} C ${x - 45} ${y + 45} ${x - 54} ${y + 55} ${x - 50} ${y + 66} C ${x - 47} ${y + 75} ${x - 33} ${y + 79} ${x - 23} ${y + 73} C ${x - 15} ${y + 68} ${x - 13} ${y + 57} ${x - 18} ${y + 50} C ${x - 22} ${y + 46} ${x - 27} ${y + 45} ${x - 34} ${y + 45} Z`}
                      fill="#9f90ef"
                      stroke={OUTLINE}
                      strokeLinejoin="round"
                      strokeWidth={STROKE}
                    />
                  </motion.g>
                  <motion.g
                    animate={isPassword ? { x: -26, y: -44, rotate: 8 } : { x: 0, y: 0, rotate: 0 }}
                    style={{ transformOrigin: `${x + 33}px ${y + 58}px` }}
                    transition={transition(delay)}
                  >
                    <path
                      d={`M ${x + 34} ${y + 45} C ${x + 45} ${y + 45} ${x + 54} ${y + 55} ${x + 50} ${y + 66} C ${x + 47} ${y + 76} ${x + 33} ${y + 80} ${x + 22} ${y + 73} C ${x + 15} ${y + 68} ${x + 13} ${y + 58} ${x + 18} ${y + 50} C ${x + 22} ${y + 46} ${x + 27} ${y + 45} ${x + 34} ${y + 45} Z`}
                      fill="#9f90ef"
                      stroke={OUTLINE}
                      strokeLinejoin="round"
                      strokeWidth={STROKE}
                    />
                  </motion.g>

                  <path
                    d={`M ${x - 30} ${y + 58} C ${x - 34} ${y + 73} ${x - 22} ${y + 84} ${x} ${y + 84} C ${x + 22} ${y + 84} ${x + 34} ${y + 72} ${x + 30} ${y + 58} C ${x + 27} ${y + 48} ${x + 20} ${y + 42} ${x} ${y + 42} C ${x - 20} ${y + 42} ${x - 27} ${y + 49} ${x - 30} ${y + 58} Z`}
                    fill="#8f85e7"
                    stroke={OUTLINE}
                    strokeLinejoin="round"
                    strokeWidth={STROKE}
                  />
                  <ellipse cx={x} cy={y + 62} fill="#ddd5ff" rx="18" ry="12" stroke={OUTLINE} strokeWidth="3" />
                </>
              )
            : null}

          {variant === 'shy'
            ? (
                <>
                  <motion.g
                    animate={isPassword ? { rotate: 10, x: 1 } : { rotate: 0, x: 0 }}
                    style={{ transformOrigin: `${x}px ${y}px` }}
                    transition={transition(delay)}
                  >
                    <path
                      d={`M ${x} ${y - 33} C ${x + 20} ${y - 35} ${x + 34} ${y - 22} ${x + 34} ${y - 4} C ${x + 34} ${y + 16} ${x + 21} ${y + 30} ${x + 1} ${y + 31} C ${x - 18} ${y + 32} ${x - 33} ${y + 18} ${x - 33} ${y} C ${x - 33} ${y - 20} ${x - 20} ${y - 32} ${x} ${y - 33} Z`}
                      fill="url(#gradShy)"
                      filter="url(#innerSoft)"
                      stroke={OUTLINE}
                      strokeLinejoin="round"
                      strokeWidth={STROKE}
                    />

                    <path d={`M ${x - 14} ${y - 26} C ${x + 1} ${y - 30} ${x + 17} ${y - 26} ${x + 24} ${y - 15}`} fill="none" opacity="0.33" stroke="white" strokeLinecap="round" strokeWidth="2.8" />

                    <motion.g animate={{ opacity: isPassword ? 0.86 : 0.55 }} transition={transition(delay)}>
                      <ellipse cx={x - 19} cy={y + 8} fill="#ff89b0" filter="url(#blushBlur)" opacity="0.85" rx="7.8" ry="5.8" />
                      <ellipse cx={x + 20} cy={y + 9.2} fill="#ff89b0" filter="url(#blushBlur)" opacity="0.76" rx="7.2" ry="5.2" />
                    </motion.g>

                    <EyeSet
                      closeScale={0.14}
                      delay={delay}
                      isEmail={isEmail}
                      isPassword={isPassword}
                      leftPupil={5.4}
                      leftSocket={7.9}
                      leftX={x - 9}
                      leftYOffset={-0.9}
                      pupilDx={pupilDx}
                      pupilDy={pupilDy}
                      rightPupil={4.5}
                      rightSocket={6.8}
                      rightX={x + 9}
                      rightYOffset={0.7}
                      withLids
                      y={y - 1}
                    />

                    <motion.path
                      animate={{ opacity: !isEmail && !isPassword ? 1 : 0 }}
                      d={`M ${x - 5} ${y + 13} L ${x} ${y + 17} L ${x + 5} ${y + 13}`}
                      fill="none"
                      stroke="#31265c"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.8"
                      transition={transition(delay)}
                    />
                    <motion.path
                      animate={{ opacity: isEmail ? 1 : 0 }}
                      d={`M ${x - 6} ${y + 12} Q ${x} ${y + 20} ${x + 7} ${y + 12}`}
                      fill="none"
                      initial={{ opacity: 0 }}
                      stroke="#31265c"
                      strokeLinecap="round"
                      strokeWidth="2.9"
                      transition={transition(delay)}
                    />
                    <motion.path
                      animate={{ opacity: isPassword ? 1 : 0 }}
                      d={`M ${x - 7} ${y + 16} Q ${x - 4} ${y + 13} ${x - 1} ${y + 16} Q ${x + 2} ${y + 19} ${x + 5} ${y + 16} Q ${x + 7} ${y + 14} ${x + 9} ${y + 16}`}
                      fill="none"
                      initial={{ opacity: 0 }}
                      stroke="#31265c"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.6"
                      transition={transition(delay)}
                    />
                  </motion.g>

                  <motion.g
                    animate={isPassword ? { x: 9, y: -8, rotate: 7 } : { x: 0, y: 0, rotate: 0 }}
                    style={{ transformOrigin: `${x - 16}px ${y + 36}px` }}
                    transition={transition(delay)}
                  >
                    <path
                      d={`M ${x - 16} ${y + 31} C ${x - 24} ${y + 32} ${x - 29} ${y + 39} ${x - 26} ${y + 45} C ${x - 24} ${y + 50} ${x - 16} ${y + 52} ${x - 10} ${y + 49} C ${x - 6} ${y + 46} ${x - 5} ${y + 40} ${x - 7} ${y + 35} C ${x - 9} ${y + 32} ${x - 12} ${y + 31} ${x - 16} ${y + 31} Z`}
                      fill="#c5b6fd"
                      stroke={OUTLINE}
                      strokeLinejoin="round"
                      strokeWidth={STROKE}
                    />
                  </motion.g>
                  <motion.g
                    animate={isPassword ? { x: 4, y: -2, rotate: 5 } : { x: 0, y: 0, rotate: 5 }}
                    style={{ transformOrigin: `${x + 16}px ${y + 36}px` }}
                    transition={transition(delay)}
                  >
                    <path
                      d={`M ${x + 16} ${y + 31} C ${x + 24} ${y + 32} ${x + 29} ${y + 39} ${x + 26} ${y + 45} C ${x + 24} ${y + 51} ${x + 16} ${y + 53} ${x + 9} ${y + 50} C ${x + 5} ${y + 47} ${x + 4} ${y + 41} ${x + 6} ${y + 36} C ${x + 8} ${y + 33} ${x + 12} ${y + 31} ${x + 16} ${y + 31} Z`}
                      fill="#c5b6fd"
                      stroke={OUTLINE}
                      strokeLinejoin="round"
                      strokeWidth={STROKE}
                    />
                  </motion.g>

                  <path
                    d={`M ${x - 16} ${y + 39} C ${x - 17} ${y + 48} ${x - 9} ${y + 54} ${x + 1} ${y + 54} C ${x + 11} ${y + 54} ${x + 17} ${y + 49} ${x + 16} ${y + 40} C ${x + 15} ${y + 34} ${x + 10} ${y + 31} ${x + 1} ${y + 31} C ${x - 8} ${y + 31} ${x - 15} ${y + 34} ${x - 16} ${y + 39} Z`}
                    fill="#d0c2ff"
                    stroke={OUTLINE}
                    strokeLinejoin="round"
                    strokeWidth={STROKE}
                  />
                </>
              )
            : null}
        </motion.g>
      </g>
    </motion.g>
  )
}

export function LoginPersonalityAnimation({ focusState }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const focusRef = useRef(focusState)

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const smoothX = useSpring(rawX, { stiffness: 150, damping: 28, mass: 0.8 })
  const smoothY = useSpring(rawY, { stiffness: 150, damping: 28, mass: 0.8 })

  useEffect(() => {
    focusRef.current = focusState
  }, [focusState])

  useEffect(() => {
    if (focusState === 'password') {
      rawX.set(0)
      rawY.set(0)
    }
  }, [focusState, rawX, rawY])

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (focusRef.current === 'password' || !containerRef.current) {
        return
      }

      const rect = containerRef.current.getBoundingClientRect()
      const nx = clamp((event.clientX - rect.left - rect.width / 2) / (rect.width / 2), -1, 1)
      const ny = clamp((event.clientY - rect.top - rect.height / 2) / (rect.height / 2), -1, 1)

      rawX.set(nx)
      rawY.set(ny)
    }

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [rawX, rawY])

  const isIdle = focusState === 'none'
  const isEmail = focusState === 'email'
  const isPassword = focusState === 'password'

  const pupilDx = useTransform(smoothX, v => clamp(v * 4.4, -4.4, 4.4))
  const pupilDy = useTransform(smoothY, v => clamp(v * 4.4, -4.4, 4.4))

  return (
    <div className="relative hidden overflow-hidden md:flex md:w-2/3" ref={containerRef}>
      <div className="relative size-full bg-surface">
        <div className="absolute left-5 top-5 flex items-center gap-2">
          <Image alt="Logo" height={36} loading="eager" src="/logo.svg" width={36} />
        </div>

        <div className="flex size-full items-center justify-center">
          <svg aria-hidden="true" className="w-full max-w-lg" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gradCalm" x1="0" x2="0" y1="70" y2="180">
                <stop offset="0%" stopColor="#dbceff" />
                <stop offset="58%" stopColor="#c5b2ff" />
                <stop offset="100%" stopColor="#a990f6" />
              </linearGradient>
              <linearGradient id="gradSilly" x1="0" x2="0" y1="58" y2="188">
                <stop offset="0%" stopColor="#c6c0ff" />
                <stop offset="58%" stopColor="#9f9bf7" />
                <stop offset="100%" stopColor="#7f79df" />
              </linearGradient>
              <linearGradient id="gradShy" x1="0" x2="0" y1="80" y2="175">
                <stop offset="0%" stopColor="#e8e0ff" />
                <stop offset="62%" stopColor="#d0c3ff" />
                <stop offset="100%" stopColor="#b19be9" />
              </linearGradient>

              <filter height="160%" id="innerSoft" width="160%" x="-30%" y="-30%">
                <feGaussianBlur in="SourceAlpha" result="blur" stdDeviation="1.4" />
                <feOffset dy="1.1" in="blur" result="offsetBlur" />
                <feComposite in="offsetBlur" in2="SourceAlpha" k2="-1" k3="1" operator="arithmetic" result="inner" />
                <feColorMatrix
                  in="inner"
                  type="matrix"
                  values="0 0 0 0 0.17 0 0 0 0 0.10 0 0 0 0 0.38 0 0 0 0.25 0"
                />
                <feBlend in="SourceGraphic" mode="multiply" />
              </filter>

              <filter id="blushBlur">
                <feGaussianBlur stdDeviation="1.6" />
              </filter>
            </defs>

            <ellipse cx="72" cy="194" fill="rgba(93,80,160,0.23)" rx="24" ry="5" />
            <ellipse cx="151" cy="195" fill="rgba(93,80,160,0.25)" rx="31" ry="5.8" />
            <ellipse cx="236" cy="194.5" fill="rgba(93,80,160,0.23)" rx="20" ry="4.4" />

            <Mascot
              delay={0}
              isEmail={isEmail}
              isIdle={isIdle}
              isPassword={isPassword}
              pupilDx={pupilDx}
              pupilDy={pupilDy}
              scale={1}
              variant="calm"
              x={72}
              y={121}
            />

            <Mascot
              delay={0.1}
              isEmail={isEmail}
              isIdle={isIdle}
              isPassword={isPassword}
              pupilDx={pupilDx}
              pupilDy={pupilDy}
              scale={1.08}
              variant="silly"
              x={151}
              y={106}
            />

            <Mascot
              delay={0.2}
              isEmail={isEmail}
              isIdle={isIdle}
              isPassword={isPassword}
              pupilDx={pupilDx}
              pupilDy={pupilDy}
              scale={0.9}
              variant="shy"
              x={236}
              y={122}
            />
          </svg>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-linear-to-t from-background/60 to-transparent" />
      </div>
    </div>
  )
}
