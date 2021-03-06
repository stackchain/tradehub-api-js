import Transport from "@ledgerhq/hw-transport"
import TransportWebHID from "@ledgerhq/hw-transport-webhid"
import TransportWebUSB from "@ledgerhq/hw-transport-webusb"

export function isBrowserSupported(): boolean {
  if (!navigator)
    throw new Error('this function is only supported for use on browsers')

  const windowObject = window as any
  const ua = navigator.userAgent.toLowerCase()
  const isChrome = /chrome|crios/.test(ua) && !/edge|opr\//.test(ua)
  const isBrave = isChrome && !windowObject.google

  if (!isChrome && !isBrave) {
    throw new Error("Your browser doesn't support Ledger devices.")
  }

  return true
}

async function getDevicePaths(
  ledgerLibrary: typeof Transport,
): Promise<ReadonlyArray<string>> {
  const supported = await ledgerLibrary.isSupported();
  if (!supported) {
    throw new Error(`Your computer does not support the ledger!`);
  }
  return await ledgerLibrary.list();
}

async function getWebHIDTransport(): Promise<Transport> {
  try {
    return await TransportWebHID.create()
  } catch (error) {
    if (error.message !== 'The device is already open.')
      throw error

    const devices = await getDevicePaths(TransportWebHID)
    const transport = new TransportWebHID(devices[0])
    return transport
  }
}

async function getWebUSBTransport(): Promise<Transport> {
  return await TransportWebUSB.create()
}

export async function getLedgerTransport(): Promise<Transport> {
  if (!navigator)
    throw new Error('this function is only supported for use on browsers')

  const isWindows = navigator.platform.toLowerCase().indexOf('win') >= 0

  const transport = await (isWindows ? getWebHIDTransport() : getWebUSBTransport())

  return transport
}
