import type { NextPage } from 'next'
import Head from 'next/head'

import styles from './index.module.css'
import OrderBook from '../components/OrderBook'

const Index: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>..:: MyBit - Order Book ::..</title>
        <meta name="description" content="Implementation of an Exchange OrderBook" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.logo} />
        <div className={styles.exchangeName}>
          MyBit
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.orderbookWrapper}>
          <OrderBook />
        </div>
      </main>

      <footer className={styles.footer}>
        <small>
          MyBit ©
          {' '}
          {new Date().getFullYear()}
        </small>
      </footer>
    </div>
  )
}

export default Index
