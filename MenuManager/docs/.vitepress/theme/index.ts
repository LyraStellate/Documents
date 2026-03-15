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
                    // DOMのscrollBehaviorを書き換え
                    document.documentElement.style.scrollBehavior = 'smooth'
                    // アニメーション完了想定時間後に元に戻す (VitePressの追従スクリプトとの競合を避けるため)
                    setTimeout(() => {
                        document.documentElement.style.scrollBehavior = ''
                    }, 1200)
                }
            })

            // ページ下部フェードオーバーレイ
            const fadeOverlay = document.createElement('div')
            fadeOverlay.classList.add('scroll-fade-bottom')
            document.body.appendChild(fadeOverlay)

            const updateFade = () => {
                const atBottom = window.scrollY + window.innerHeight >= document.body.scrollHeight - 40
                fadeOverlay.classList.toggle('hidden', atBottom)
            }
            window.addEventListener('scroll', updateFade, { passive: true })
            updateFade()
        }

        watch(() => route.path, () => {
            if (typeof document === 'undefined') return
            nextTick(() => {
                // コンテンツ部分のみをアニメーションさせる（SidebarやTOCのfixed配置を壊さないため .vp-doc を狙う）
                const content = document.querySelector('.vp-doc') || document.querySelector('.VPContent')
                if (content) {
                    content.classList.remove('page-fade-in')
                    void (content as HTMLElement).offsetWidth
                    content.classList.add('page-fade-in')
                }

                // ページ遷移時にフェードオーバーレイをリセット
                const overlay = document.querySelector('.scroll-fade-bottom')
                if (overlay) overlay.classList.remove('hidden')
            })
        }, { immediate: true }) // 初回レンダー時にも適用
    }
}
