import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'
import { watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'
import './custom.css'

export default {
    extends: DefaultTheme,
    enhanceApp({ app }: { app: any }) {
        enhanceAppWithTabs(app)
    },
    setup() {
        const route = useRoute()

        if (typeof window !== 'undefined') {
            // 目次などページ内リンクをクリックした時だけスムーススクロールにする
            window.addEventListener('click', (e: MouseEvent) => {
                const link = (e.target as HTMLElement).closest('a')
                if (link && link.hash && link.origin === window.location.origin && link.pathname === window.location.pathname) {
                    document.documentElement.style.scrollBehavior = 'smooth'
                    setTimeout(() => {
                        document.documentElement.style.scrollBehavior = ''
                    }, 1200)
                }
            })
        }

        let scrollRevealObserver: IntersectionObserver | null = null

        watch(() => route.path, () => {
            if (typeof document === 'undefined') return
            nextTick(() => {
                // ページ遷移フェードイン
                const content = document.querySelector('.vp-doc') || document.querySelector('.VPContent')
                if (content) {
                    content.classList.remove('page-fade-in')
                    void (content as HTMLElement).offsetWidth
                    content.classList.add('page-fade-in')
                }

                // scroll-reveal: 前回のオブザーバーを破棄して再構築
                if (scrollRevealObserver) {
                    scrollRevealObserver.disconnect()
                    scrollRevealObserver = null
                }

                const doc = document.querySelector('.vp-doc')
                if (!doc) return

                scrollRevealObserver = new IntersectionObserver(
                    (entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                entry.target.classList.add('fade-in-visible')
                                scrollRevealObserver?.unobserve(entry.target)
                            }
                        })
                    },
                    { threshold: 0.1, rootMargin: '0px 0px -20px 0px' }
                )

                const targets = doc.querySelectorAll('h2, h3, p, table, pre, blockquote, .custom-block, img, ul, ol')
                targets.forEach(el => {
                    el.classList.remove('fade-in-visible')
                    el.classList.add('fade-in-element')
                    scrollRevealObserver!.observe(el)
                })
            })
        }, { immediate: true })
    }
}
