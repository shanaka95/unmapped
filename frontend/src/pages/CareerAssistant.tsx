import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import lottie from 'lottie-web'
import Footer from '../components/Footer'

export default function CareerAssistant() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const animRef = useRef<HTMLDivElement>(null)
  const [showContent, setShowContent] = useState(false)

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
    // Delay content reveal for a smooth entrance
    const timer = setTimeout(() => setShowContent(true), 400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-poppins text-body-md">
      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg flex flex-col items-center gap-10">
          {/* Hand wave animation */}
          <div ref={animRef} className="w-48 h-48" />

          {/* Greeting */}
          <div
            className={`text-center transition-all duration-700 ease-out ${
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <h1 className="font-poppins text-h1 text-on-surface">
              {t('careerAssistant.greeting')}
            </h1>
            <p className="font-poppins text-body-lg text-on-surface-variant mt-4 leading-relaxed">
              {t('careerAssistant.intro')}
            </p>
          </div>

          {/* CTA */}
          <div
            className={`flex flex-col items-center gap-4 transition-all duration-700 ease-out delay-500 ${
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <p className="font-poppins text-body-md text-on-surface-variant text-center">
              {t('careerAssistant.cta')}
            </p>
            <button
              onClick={() => navigate('/profession-match')}
              className="font-poppins text-label-sm bg-primary text-on-primary px-10 py-4 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 cursor-pointer"
            >
              {t('careerAssistant.button')}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
