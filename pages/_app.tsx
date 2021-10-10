import './globals.css'
import type { AppProps } from 'next/app'

function MyBit({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
export default MyBit
