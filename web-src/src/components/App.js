import React, { useState } from 'react'
import {
  Provider,
  defaultTheme,
  View,
  Flex,
  Heading,
  Content,
  Text,
  TextField,
  Button,
  InlineAlert,
  ProgressCircle,
} from '@adobe/react-spectrum'
import actions from '../config.json'

export default function App({ runtime, ims }) {
  // Do NOT call runtime.done() here — index.js calls it in the ready handler
  const greetUrl = actions['greet'] // empty string until deployed or sandbox running

  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleGreet() {
    setError('')
    setMessage('')

    if (!greetUrl) {
      setError('Action URL not available yet. Deploy the app or start the preview first.')
      return
    }
    if (!name.trim()) {
      setError('Please enter a name.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(greetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ims.token}`,
          'x-gw-ims-org-id': ims.org,
        },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error(`Action failed: ${res.status}`)
      const data = await res.json()
      setMessage(data.message)
    } catch (e) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Provider theme={defaultTheme} colorScheme="light">
      <View padding="size-400" maxWidth="size-6000" marginX="auto">
        <Flex direction="column" gap="size-300">
          <Heading level={1}>Hello App</Heading>
          <Content>Enter your name and the greeting action will respond.</Content>

          <TextField
            label="Your name"
            value={name}
            onChange={setName}
            onKeyDown={(e) => e.key === 'Enter' && handleGreet()}
            width="100%"
          />

          <Flex gap="size-200" alignItems="center">
            <Button variant="accent" onPress={handleGreet} isPending={isLoading}>
              Greet me
            </Button>
            {isLoading && <ProgressCircle aria-label="Loading" isIndeterminate size="S" />}
          </Flex>

          {message && (
            <InlineAlert variant="positive">
              <Heading>Success</Heading>
              <Content>{message}</Content>
            </InlineAlert>
          )}

          {error && (
            <InlineAlert variant="negative">
              <Heading>Error</Heading>
              <Content>{error}</Content>
            </InlineAlert>
          )}

          {ims?.profile?.name && (
            <Text>Signed in as {ims.profile.name}</Text>
          )}
        </Flex>
      </View>
    </Provider>
  )
}
