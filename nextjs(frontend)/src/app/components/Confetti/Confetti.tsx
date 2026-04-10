'use client'

import { useEffect, useRef } from "react"
import confetti from "canvas-confetti"

const COOLDOWN_KEY = "confetti_last_played"
const COOLDOWN_TIME = 30 * 1000 

const Confetti = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        if (!canvasRef.current) return

        const now = Date.now()
        const lastPlayed = localStorage.getItem(COOLDOWN_KEY)

        if (lastPlayed && now - Number(lastPlayed) < COOLDOWN_TIME) {
            console.log("⏳ Confetti cooldown active")
            return
        }

        localStorage.setItem(COOLDOWN_KEY, String(now))

        const myConfetti = confetti.create(canvasRef.current, {
            resize: true,
        })

        const duration = 1000
        const animationEnd = Date.now() + duration

        const defaults = {
            startVelocity: 50,
            spread: 80,
            ticks: 800,
            zIndex: 0
        }

        const randomInRange = (min: number, max: number) =>
            Math.random() * (max - min) + min

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now()

            if (timeLeft <= 0) {
                clearInterval(interval)
                return
            }

            const particleCount = 50 * (timeLeft / duration)

            myConfetti({
                ...defaults,
                particleCount,
                angle: randomInRange(55, 75),
                origin: { x: 0, y: randomInRange(0.5, 0.8) }
            })

            myConfetti({
                ...defaults,
                particleCount,
                angle: randomInRange(105, 125),
                origin: { x: 1, y: randomInRange(0.5, 0.8) }
            })

        }, 250)

        return () => clearInterval(interval)
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="checkout-confetti-canvas"
        />
    )
}

export default Confetti