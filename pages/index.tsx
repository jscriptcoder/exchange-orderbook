import type { NextPage } from 'next'
import Head from 'next/head'

import styles from '../styles/Home.module.css'
import OrderBook from '../components/OrderBook'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>..:: My Exchange - Order Book ::..</title>
        <meta name="description" content="Implementation of an Exchange OrderBook" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.exchangeName}>My Exchange</div>
      </header>

      <main className={styles.main}>
        <OrderBook />
      </main>

      <footer className={styles.footer}>
        <small>
          My Exchange ©
          {' '}
          {new Date().getFullYear()}
        </small>
      </footer>
    </div>
  )
}

export default Home
