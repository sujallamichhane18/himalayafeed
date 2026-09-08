import { PRIVATE_RESERVED_CIDRS, IPV4_RE, inCidr, isPrivateReservedIpv6, isStrictIpv6 } from './ipValidation'

/** Longest indicator we accept on the scan endpoint (mirrors the web UI cap). */
export const MAX_INDICATOR_LENGTH = 255
export const MAX_COMMENT_LENGTH = 1000
export const MAX_CATEGORY_LENGTH = 200

/**
 * True only for syntactically valid, publicly routable IPv4/IPv6 addresses.
 * Rejects private, reserved, loopback, link-local and multicast ranges so the
 * API cannot be used to poison the community blocklist with junk or internal IPs.
 */
export function isValidPublicIp(ip: string): boolean {
  if (IPV4_RE.test(ip)) {
    return !PRIVATE_RESERVED_CIDRS.some((cidr) => inCidr(ip, cidr))
  }
  if (ip.includes(':')) {
    return isStrictIpv6(ip) && !isPrivateReservedIpv6(ip)
  }
  return false
}

/** Category labels must be short and free of control / markup characters. */
export function isValidCategory(category: string): boolean {
  return (
    category.length > 0 &&
    category.length <= MAX_CATEGORY_LENGTH &&
    /^[A-Za-z0-9 ,_\-/]+$/.test(category)
  )
}
