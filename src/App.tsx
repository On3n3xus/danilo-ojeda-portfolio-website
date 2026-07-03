import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight, Bot } from 'lucide-react'
import * as THREE from 'three'
import './App.css'

gsap.registerPlugin(ScrollTrigger)

const HEADSHOT = '/danilo-headshot.png'

const work = [
  {
    roman: 'I',
    title: 'Wyn Intelligence',
    text: 'Broker command center with CRM views, listing workflows, campaign approvals, and a performance dashboard.',
    action: 'Private case study',
  },
  {
    roman: 'II',
    title: 'Miguel Closes',
    text: 'Full site and GoHighLevel build with nurture sequences, lead capture, and realtor pipeline automation.',
    action: 'Visit',
    href: 'https://miguelcloses.com',
  },
  {
    roman: 'III',
    title: 'MicroCommit',
    text: 'iOS habit app with AI coaching, streak tracking, and community challenges.',
    action: 'Product build',
  },
]

const services = [
  'Voice agents for inbound and outbound leasing calls',
  'Lead engines for buyer-intent scraping and CRM movement',
  'CRE workflows for NNN retail, medical office, and strip centers',
]

function FutureCity() {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x050403, 0.018)

    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 260)
    camera.position.set(0, 18, 58)
    camera.lookAt(0, 10, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x050403, 1)
    mount.appendChild(renderer.domElement)

    const city = new THREE.Group()
    scene.add(city)

    const ambient = new THREE.AmbientLight(0x3a2014, 4.2)
    scene.add(ambient)

    const sun = new THREE.DirectionalLight(0xffb36b, 4.5)
    sun.position.set(-14, 28, 20)
    scene.add(sun)

    const glowA = new THREE.PointLight(0xff6a2f, 210, 130)
    glowA.position.set(-28, 22, 8)
    scene.add(glowA)

    const glowB = new THREE.PointLight(0x10b981, 140, 120)
    glowB.position.set(28, 18, -24)
    scene.add(glowB)

    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x16110d,
      roughness: 0.58,
      metalness: 0.42,
      emissive: 0x140803,
      emissiveIntensity: 0.48,
    })

    const warmWindow = new THREE.MeshBasicMaterial({ color: 0xff8b3d })
    const greenWindow = new THREE.MeshBasicMaterial({ color: 0x10b981 })
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0a0807,
      roughness: 0.36,
      metalness: 0.55,
      emissive: 0x100905,
      emissiveIntensity: 0.45,
    })
    const laneMat = new THREE.MeshBasicMaterial({ color: 0xd96332 })

    for (let x = -7; x <= 7; x += 1) {
      for (let z = -9; z <= 6; z += 1) {
        if (Math.abs(x) < 2 && z > -7) continue
        const hash = Math.abs(Math.sin(x * 12.9898 + z * 78.233))
        const height = 5 + hash * 27
        const width = 1.15 + (hash % 0.45)
        const depth = 1.1 + ((hash * 1.7) % 0.5)
        const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), buildingMat)
        building.position.set(x * 3.1, height / 2 - 4, z * 3.4)
        city.add(building)

        const windowRows = Math.floor(height / 2.2)
        for (let row = 0; row < windowRows; row += 1) {
          if ((row + x + z) % 3 === 0) continue
          const window = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.78, 0.08, 0.018),
            (row + x) % 5 === 0 ? greenWindow : warmWindow,
          )
          window.position.set(
            building.position.x,
            row * 1.8 + 0.6,
            building.position.z + depth / 2 + 0.011,
          )
          city.add(window)
        }
      }
    }

    const boulevard = new THREE.Mesh(new THREE.BoxGeometry(8, 0.12, 90), roadMat)
    boulevard.position.set(0, -3.92, -10)
    city.add(boulevard)

    for (let x of [-3.1, 3.1]) {
      const lane = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 86), laneMat)
      lane.position.set(x, -3.82, -10)
      city.add(lane)
    }

    const spireMat = new THREE.MeshStandardMaterial({
      color: 0x1c120d,
      roughness: 0.32,
      metalness: 0.72,
      emissive: 0x331006,
      emissiveIntensity: 0.85,
    })
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 3.4, 48, 7), spireMat)
    spire.position.set(10, 20, -24)
    spire.rotation.y = 0.32
    city.add(spire)

    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff6a2f, transparent: true, opacity: 0.8 })
    for (let i = 0; i < 3; i += 1) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(8 + i * 2.4, 0.035, 8, 96), ringMat)
      ring.position.set(10, 13 + i * 7, -24)
      ring.rotation.x = Math.PI / 2
      ring.rotation.z = i * 0.38
      city.add(ring)
    }

    const skyRails = new THREE.Group()
    city.add(skyRails)
    for (let y of [6, 12, 18]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(54, 0.08, 0.08), greenWindow)
      rail.position.set(0, y, -18 + y * 0.7)
      rail.rotation.y = -0.18
      skyRails.add(rail)
    }

    const cars: THREE.Mesh[] = []
    const carGeo = new THREE.BoxGeometry(0.9, 0.22, 0.3)
    for (let i = 0; i < 22; i += 1) {
      const car = new THREE.Mesh(carGeo, i % 3 === 0 ? greenWindow : warmWindow)
      car.position.set((i % 2 ? -1 : 1) * (4 + (i % 5) * 2.1), 5 + (i % 4) * 3.6, -42 + i * 4.8)
      car.userData.speed = 0.08 + (i % 5) * 0.018
      cars.push(car)
      city.add(car)
    }

    const starsGeo = new THREE.BufferGeometry()
    const starPositions = new Float32Array(720)
    for (let i = 0; i < starPositions.length; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 120
      starPositions[i + 1] = 18 + Math.random() * 60
      starPositions[i + 2] = -90 + Math.random() * 110
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffb36b, size: 0.05, transparent: true, opacity: 0.55 }))
    scene.add(stars)

    let scrollProgress = 0
    let frame = 0

    const updateSize = () => {
      const width = mount.clientWidth || window.innerWidth
      const height = mount.clientHeight || window.innerHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const updateScroll = () => {
      const hero = document.querySelector('.hero-scene') as HTMLElement | null
      if (!hero) return
      const rect = hero.getBoundingClientRect()
      const travel = Math.max(1, rect.height - window.innerHeight)
      scrollProgress = Math.min(1, Math.max(0, Math.abs(rect.top) / travel))
    }

    const animate = () => {
      frame += 0.01
      city.rotation.y = -0.12 + scrollProgress * 0.28 + Math.sin(frame * 0.35) * 0.015
      city.position.z = scrollProgress * 12
      camera.position.x = Math.sin(frame * 0.28) * 2.4 + scrollProgress * 8
      camera.position.y = 13 + scrollProgress * 8
      camera.position.z = 50 - scrollProgress * 18
      camera.lookAt(3 + scrollProgress * 5, 9 + scrollProgress * 5, -18)
      stars.rotation.y += 0.0008

      cars.forEach((car, index) => {
        car.position.z += car.userData.speed
        car.position.y += Math.sin(frame * 3 + index) * 0.004
        if (car.position.z > 34) car.position.z = -48
      })

      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }

    updateSize()
    updateScroll()
    animate()
    window.addEventListener('resize', updateSize)
    window.addEventListener('scroll', updateScroll, { passive: true })

    return () => {
      window.removeEventListener('resize', updateSize)
      window.removeEventListener('scroll', updateScroll)
      renderer.dispose()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
        }
      })
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="future-city-canvas" aria-label="Animated 3D future city" />
}

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
    })

    const raf = (time: number) => lenis.raf(time * 1000)
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.scene').forEach((scene) => {
        const title = scene.querySelector('.scene-title')
        const media = scene.querySelector('.scene-media')
        const cards = scene.querySelectorAll('.work-card, .service-line')

        gsap.fromTo(
          title,
          { opacity: 0.2, y: 90, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: scene,
              start: 'top 72%',
              end: 'top 18%',
              scrub: true,
            },
          },
        )

        gsap.fromTo(
          media,
          { scale: 1.08, y: 70 },
          {
            scale: 1,
            y: -45,
            ease: 'none',
            scrollTrigger: {
              trigger: scene,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        )

        gsap.fromTo(
          cards,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: scene,
              start: 'top 28%',
              end: 'top top',
              scrub: 0.7,
            },
          },
        )
      })
    })

    window.setTimeout(() => {
      if (!window.location.hash) return
      const target = document.querySelector(window.location.hash)
      target?.scrollIntoView({ block: 'start' })
    }, 100)

    return () => {
      ctx.revert()
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])

  return (
    <main>
      <nav className="top-nav" aria-label="Portfolio navigation">
        <a href="#top">ZT · 26</a>
        <a href="#top">AI builder - Danilo Ojeda</a>
        <a href="#contact">Contact</a>
      </nav>

      <section className="scene hero-scene" id="top">
        <div className="scene-media hero-media" aria-hidden="true">
          <FutureCity />
          <div className="city-vignette" />
        </div>
        <div className="scene-copy">
          <p className="scene-kicker"><span>(01)</span> Portfolio</p>
          <h1 className="scene-title">Proof<br />of Work<span>.</span></h1>
          <p className="scene-subtitle">AI systems for commercial real estate. Voice agents, lead engines, and the automation behind them.</p>
        </div>
        <div className="work-strip" id="work">
          {work.map((project) => {
            const content = (
              <>
                <p>{project.roman}</p>
                <h2>{project.title}</h2>
                <span>{project.text}</span>
                <b>{project.action}</b>
              </>
            )
            return project.href ? (
              <a className="work-card" href={project.href} target="_blank" rel="noreferrer" key={project.title}>
                {content}
                <ArrowUpRight size={20} />
              </a>
            ) : (
              <article className="work-card" key={project.title}>
                {content}
                <Bot size={20} />
              </article>
            )
          })}
        </div>
      </section>

      <section className="scene builder-scene" id="builder">
        <div className="scene-media builder-media" aria-hidden="true">
          <div className="city-continuation">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="desk" />
          <div className="monitor monitor-main">
            <i />
            <i />
            <i />
          </div>
          <div className="monitor monitor-left">
            <i />
            <i />
          </div>
          <div className="monitor monitor-right">
            <i />
            <i />
          </div>
          <img src={HEADSHOT} alt="" className="builder-person" />
        </div>
        <div className="scene-copy centered">
          <p className="scene-kicker"><span>(02)</span> What I do</p>
          <h2 className="scene-title">The Builder</h2>
          <p className="scene-subtitle">I connect calls, lead capture, CRM movement, campaign approval, underwriting notes, and follow-up.</p>
        </div>
        <div className="service-panel">
          {services.map((service, index) => (
            <div className="service-line" key={service}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{service}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="scene closer-scene" id="closer">
        <div className="scene-media closer-media" aria-hidden="true">
          <div className="city-continuation closer-depth">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="gallery-wall wall-left" />
          <div className="gallery-wall wall-right" />
          <div className="gallery-floor" />
          <img src={HEADSHOT} alt="" className="closer-person" />
        </div>
        <div className="scene-copy centered">
          <p className="scene-kicker"><span>(03)</span> The offer</p>
          <h2 className="scene-title">The Closer</h2>
          <p className="scene-subtitle">For brokers and operators who want practical AI systems tied to revenue, not a novelty demo.</p>
        </div>
      </section>

      <section className="final-scene" id="contact">
        <div className="final-city-continuation" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <p className="scene-kicker"><span>(04)</span> Work with me</p>
        <h2>Build the operating system behind your next CRE pipeline.</h2>
        <div className="final-actions">
          <a href="https://www.linkedin.com/in/daniloojeda/" target="_blank" rel="noreferrer">Book a call</a>
          <a href="#work">See the work</a>
        </div>
        <footer>
          <a href="https://www.facebook.com/on3n3xus" target="_blank" rel="noreferrer">Facebook</a>
          <a href="https://www.linkedin.com/in/daniloojeda/" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="https://www.instagram.com/daniloojeda_/" target="_blank" rel="noreferrer">Instagram</a>
        </footer>
      </section>
    </main>
  )
}

export default App
