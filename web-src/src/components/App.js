import React, { useState, useEffect, useCallback } from 'react'
import {
  Provider, defaultTheme, View, Flex, Heading, Content, Text,
  DropZone, IllustratedMessage, Button, ActionButton, ProgressCircle,
  InlineAlert, TableView, TableHeader, TableBody, Column, Row, Cell,
  FileTrigger, DialogTrigger, AlertDialog
} from '@adobe/react-spectrum'
import Upload from '@spectrum-icons/illustrations/Upload'
import NoSearchResults from '@spectrum-icons/illustrations/NoSearchResults'
import Download from '@spectrum-icons/workflow/Download'
import Delete from '@spectrum-icons/workflow/Delete'
import actions from '../config.json'

// Runtime payload cap (1MB) minus base64 overhead — keep decoded files under ~700KB.
const MAX_BYTES = 700 * 1024

function formatSize (bytes) {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate (iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d) ? '—' : d.toLocaleString()
}

async function invokeAction (url, ims, { method = 'POST', body } = {}) {
  if (!url) return null // config.json is empty before deploy/preview
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ims.token}`,
      'x-gw-ims-org-id': ims.org
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Action failed: ${res.status}`)
  return data
}

// Read a File into a base64 string (no data-URL prefix).
function fileToBase64 (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export default function App ({ runtime, ims }) {
  const listUrl = actions['list-files']
  const uploadUrl = actions['upload-file']
  const deleteUrl = actions['delete-file']
  const notDeployed = !listUrl

  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const refresh = useCallback(async () => {
    if (notDeployed) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const data = await invokeAction(listUrl, ims, { method: 'GET' })
      setFiles((data && data.files) || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [listUrl, ims, notDeployed])

  useEffect(() => { refresh() }, [refresh])

  const uploadFiles = useCallback(async (fileList) => {
    const list = Array.from(fileList || [])
    if (list.length === 0) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      for (const file of list) {
        if (file.size > MAX_BYTES) {
          throw new Error(`"${file.name}" is ${formatSize(file.size)} — max upload is ${formatSize(MAX_BYTES)}.`)
        }
        const content = await fileToBase64(file)
        await invokeAction(uploadUrl, ims, { body: { fileName: file.name, content } })
      }
      setNotice(`Uploaded ${list.length} file${list.length > 1 ? 's' : ''}.`)
      await refresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }, [uploadUrl, ims, refresh])

  const removeFile = useCallback(async (name) => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await invokeAction(deleteUrl, ims, { body: { name } })
      setNotice(`Deleted "${name}".`)
      await refresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }, [deleteUrl, ims, refresh])

  return (
    <Provider theme={defaultTheme} colorScheme="light">
      <View padding="size-400" maxWidth="960px" marginX="auto">
        <Flex direction="column" gap="size-300">
          <Flex direction="column" gap="size-50">
            <Heading level={1} margin={0}>File Vault</Heading>
            <Text>Upload files to your App Builder storage, then download or remove them.</Text>
          </Flex>

          {notDeployed && (
            <InlineAlert variant="info">
              <Heading>Not connected yet</Heading>
              <Content>Action URLs are empty. Run <code>aio app deploy</code> (or start the sandbox preview) to enable uploads.</Content>
            </InlineAlert>
          )}

          {error && (
            <InlineAlert variant="negative">
              <Heading>Something went wrong</Heading>
              <Content>{error}</Content>
            </InlineAlert>
          )}

          {notice && (
            <InlineAlert variant="positive">
              <Heading>Done</Heading>
              <Content>{notice}</Content>
            </InlineAlert>
          )}

          <DropZone
            isDisabled={notDeployed || busy}
            isFilled={dragActive}
            onDropEnter={() => setDragActive(true)}
            onDropExit={() => setDragActive(false)}
            onDrop={async (e) => {
              setDragActive(false)
              const items = await Promise.all(
                e.items.filter(i => i.kind === 'file').map(i => i.getFile())
              )
              uploadFiles(items)
            }}
          >
            <IllustratedMessage>
              <Upload />
              <Heading>Drag files here</Heading>
              <Content>
                <Flex direction="column" alignItems="center" gap="size-150">
                  <Text>Max {formatSize(MAX_BYTES)} per file</Text>
                  <FileTrigger allowsMultiple onSelect={uploadFiles}>
                    <Button variant="accent" isDisabled={notDeployed || busy}>Browse files</Button>
                  </FileTrigger>
                </Flex>
              </Content>
            </IllustratedMessage>
          </DropZone>

          <Flex alignItems="center" gap="size-150">
            <Heading level={3} margin={0}>Your files</Heading>
            {busy && <ProgressCircle aria-label="Working" isIndeterminate size="S" />}
            <View flex />
            <ActionButton onPress={refresh} isDisabled={notDeployed || loading}>Refresh</ActionButton>
          </Flex>

          {loading ? (
            <Flex alignItems="center" justifyContent="center" height="size-3000">
              <ProgressCircle aria-label="Loading files" isIndeterminate size="L" />
            </Flex>
          ) : (
            <TableView aria-label="Uploaded files" density="spacious">
              <TableHeader>
                <Column>Name</Column>
                <Column width={120} align="end">Size</Column>
                <Column width={220}>Uploaded</Column>
                <Column width={140} align="end">Actions</Column>
              </TableHeader>
              <TableBody
                items={files}
                renderEmptyState={() => (
                  <IllustratedMessage>
                    <NoSearchResults />
                    <Heading>No files yet</Heading>
                    <Content>Upload a file to get started.</Content>
                  </IllustratedMessage>
                )}
              >
                {(item) => (
                  <Row key={item.key}>
                    <Cell>{item.name}</Cell>
                    <Cell>{formatSize(item.size)}</Cell>
                    <Cell>{formatDate(item.lastModified)}</Cell>
                    <Cell>
                      <Flex gap="size-100" justifyContent="end">
                        <ActionButton
                          isQuiet
                          aria-label={`Download ${item.name}`}
                          isDisabled={!item.url}
                          onPress={() => item.url && window.open(item.url, '_blank')}
                        >
                          <Download />
                        </ActionButton>
                        <DialogTrigger>
                          <ActionButton isQuiet aria-label={`Delete ${item.name}`} isDisabled={busy}>
                            <Delete />
                          </ActionButton>
                          <AlertDialog
                            variant="destructive"
                            title="Delete file"
                            primaryActionLabel="Delete"
                            cancelLabel="Cancel"
                            onPrimaryAction={() => removeFile(item.name)}
                          >
                            Delete "{item.name}"? This cannot be undone.
                          </AlertDialog>
                        </DialogTrigger>
                      </Flex>
                    </Cell>
                  </Row>
                )}
              </TableBody>
            </TableView>
          )}
        </Flex>
      </View>
    </Provider>
  )
}
