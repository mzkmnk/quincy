import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Quincy Documentation',
  description: 'Documentation for Quincy - An Amazon Q CLI Management Tool',
  
  // GitHub Pages設定 - リポジトリ名に基づいてbaseを設定
  base: '/quincy/',
  
  // ファビコン設定
  head: [
    ['link', { rel: 'icon', href: '/quincy/icon.png' }]
  ],
  
  themeConfig: {
    // ナビゲーションロゴ
    logo: '/quincy/icon.png',
    
    // ナビゲーション
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'API', link: '/api/' }
    ],

    // サイドバー
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Getting Started', link: '/getting-started' }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Backend API', link: '/api/backend' },
          { text: 'Frontend Components', link: '/api/frontend' }
        ]
      }
    ],

    // ソーシャルリンク
    socialLinks: [
      { icon: 'github', link: 'https://github.com/mzkmnk/quincy' }
    ],

    // フッター
    footer: {
      message: 'Released under the ISC License.',
      copyright: 'Copyright © 2024 Quincy Team'
    }
  }
})