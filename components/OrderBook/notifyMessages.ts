import { ArgsProps } from 'antd/lib/notification'

export const ServiceClosedMsg = (code: number): ArgsProps => ({
  message: 'Service closed',
  description: `Service closed the connection with code ${code}`
})

export const ServiceErrorMsg = (error: Error): ArgsProps => ({
  message: 'Service error',
  description: `Service error '${error.name}' with message '${error.message}'`
})

export const ClientDisconnectMsg = (): ArgsProps => ({
  message: 'Client disconnected',
  description: `Client has unexpectedly disconnected`
})

export const ClientErrorMsg = (error: Event): ArgsProps => ({
  message: 'Client error',
  description: `Client error: ${error}`
})