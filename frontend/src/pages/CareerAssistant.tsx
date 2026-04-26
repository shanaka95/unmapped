import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import lottie from 'lottie-web'
import Footer from '../components/Footer'

const TYPE_SPEED = 12 // ms per character

export default function CareerAssistant() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const animRef = useRef<HTMLDivElement>(null)
  const [greetingVisible, setGreetingVisible] = useState(false)
  const [typedIntro, setTypedIntro] = useState('')
  const [typedCta, setTypedCta] = useState('')
  const [showButton, setShowButton] = useState(false)

  const intro = t('careerAssistant.intro')
  const cta = t('careerAssistant.cta')

  useEffect(() => {
    if (animRef.current) {
      lottie.loadAnimation({
        container: animRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: '/hand-wave.json',
      })
    }

    // Step 1: Show greeting
    const t1 = setTimeout(() => setGreetingVisible(true), 400)

    // Step 2: Type intro text
    const t2 = setTimeout(() => {
      let i = 0
      const interval = setInterval(() => {
        i++
        setTypedIntro(intro.slice(0, i))
        if (i >= intro.length) {
          clearInterval(interval)
          // Step 3: Type CTA text after intro finishes
          const t3 = setTimeout(() => {
            let j = 0
            const interval2 = setInterval(() => {
              j++
              setTypedCta(cta.slice(0, j))
              if (j >= cta.length) {
                clearInterval(interval2)
                // Step 4: Show button
                setTimeout(() => setShowButton(true), 300)
              }
            }, TYPE_SPEED)
            return () => clearInterval(interval2)
          }, 500)
          return () => clearTimeout(t3)
        }
      }, TYPE_SPEED)
      return () => clearInterval(interval)
    }, 1000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [intro, cta])

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-poppins text-body-md">
      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg flex flex-col items-center gap-10">
          {/* Hand wave animation */}
          <div className="w-36 h-36 overflow-hidden" style={{ transform: 'scale(0.85)' }}>
            <div ref={animRef} className="w-full h-full" />
          </div>

          {/* Greeting */}
          <div
            className={`text-center transition-all duration-700 ease-out ${
              greetingVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <h1 className="font-poppins text-h1 text-on-surface">
              {t('careerAssistant.greeting')}
            </h1>
          </div>

          {/* Typed intro */}
          {typedIntro && (
            <p className="font-poppins text-body-lg text-on-surface-variant leading-relaxed text-center">
              {typedIntro}
              {!showButton && typedCta.length === 0 && (
                <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-pulse" />
              )}
            </p>
          )}

          {/* Typed CTA */}
          {typedCta && (
            <p className="font-poppins text-body-md text-on-surface-variant text-center mt-2">
              {typedCta}
              {!showButton && (
                <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-pulse" />
              )}
            </p>
          )}

          {/* Button */}
          {showButton && (
            <button
              onClick={() => navigate('/profession-match')}
              className="font-poppins text-label-sm bg-primary text-on-primary px-10 py-4 rounded-default uppercase tracking-wider hover:opacity-80 transition-all duration-700 ease-out opacity-100 translate-y-0 cursor-pointer"
            >
              {t('careerAssistant.button')}
            </button>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
