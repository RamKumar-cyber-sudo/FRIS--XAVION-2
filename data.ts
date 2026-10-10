export type Sev = 'Critical' | 'High' | 'Medium' | 'Low'
export type Status = 'Open' | 'In Progress' | 'Fixed' | 'Verified'
export interface Finding {
  id: string; cve: string; verified: boolean; comp: string; ver: string; cvss: number
  kev: boolean; exposed: boolean; title: string; impact: string; fix: string
}
export const META = {
  device: 'XAVION Edge Gateway', firmware: 'xeg-fw-1.1.0.bin', version: '1.1.0',
  date: '2026-10-10 14:30 IST', mode: 'Demonstration data (no live scan performed)',
}
export const components = [
  { name: 'openssl', version: '1.0.1e', type: 'library' },
  { name: 'sudo', version: '1.8.27', type: 'binary' },
  { name: 'busybox', version: '1.30.1', type: 'binary' },
  { name: 'dnsmasq', version: '2.80', type: 'service' },
  { name: 'mosquitto', version: '1.6.9', type: 'service' },
  { name: 'dropbear', version: '2019.78', type: 'service' },
]
// Baseline = approved firmware 1.0.0
export const baseline = [
  { name: 'openssl', version: '1.0.1e' }, { name: 'sudo', version: '1.8.27' },
  { name: 'busybox', version: '1.29.3' }, { name: 'dnsmasq', version: '2.80' },
  { name: 'lighttpd', version: '1.4.55' },
]
// CVE-2014-0160 and CVE-2021-3156 are real, widely documented records (also in CISA KEV).
// Re-check scores and affected versions on nvd.nist.gov before citing. FRIS-DEMO-* are illustrative, not real CVEs.
export const findings: Finding[] = [
  { id: 'F1', cve: 'CVE-2014-0160', verified: true, comp: 'openssl', ver: '1.0.1e', cvss: 7.5, kev: true, exposed: true,
    title: 'OpenSSL TLS heartbeat information disclosure (Heartbleed)',
    impact: 'A remote attacker can read process memory, which may include private keys and session data.',
    fix: 'Upgrade OpenSSL to a currently supported release and rebuild the firmware image. Rotate any keys the device used.' },
  { id: 'F2', cve: 'CVE-2021-3156', verified: true, comp: 'sudo', ver: '1.8.27', cvss: 7.8, kev: true, exposed: false,
    title: 'sudo heap-based buffer overflow (Baron Samedit)',
    impact: 'A local user can gain root privileges. Exposure depends on whether untrusted users have shell access.',
    fix: 'Upgrade sudo to a fixed version, or remove sudo from the image if it is not needed.' },
  { id: 'F3', cve: 'FRIS-DEMO-001', verified: false, comp: 'busybox', ver: '1.30.1', cvss: 9.1, kev: false, exposed: true,
    title: 'Illustrative: BusyBox applet input handling flaw',
    impact: 'Illustrative finding to demonstrate a Critical severity workflow. Not a real vulnerability record.',
    fix: 'Update BusyBox to the latest stable release and disable unused applets.' },
  { id: 'F4', cve: 'FRIS-DEMO-002', verified: false, comp: 'dnsmasq', ver: '2.80', cvss: 6.5, kev: false, exposed: true,
    title: 'Illustrative: DNS cache handling weakness',
    impact: 'Illustrative finding. Could allow cache poisoning in a real-world equivalent.',
    fix: 'Upgrade dnsmasq and restrict the DNS listener to the LAN interface.' },
  { id: 'F5', cve: 'FRIS-DEMO-003', verified: false, comp: 'mosquitto', ver: '1.6.9', cvss: 4.3, kev: false, exposed: false,
    title: 'Illustrative: MQTT broker information leak',
    impact: 'Illustrative low-impact finding showing how Low items are handled.',
    fix: 'Upgrade mosquitto and require authentication on all listeners.' },
]
export const sevOf = (c: number): Sev => (c >= 9 ? 'Critical' : c >= 7 ? 'High' : c >= 4 ? 'Medium' : 'Low')
// Demonstration scoring model (NOT a CVSS score): cvss*7 (max 70) + 20 if in CISA KEV + 10 if service is network-exposed.
export const score = (f: Finding) => {
  const base = Math.round(f.cvss * 7 * 10) / 10, kev = f.kev ? 20 : 0, exp = f.exposed ? 10 : 0
  const total = Math.round((base + kev + exp) * 10) / 10
  return { base, kev, exp, total, band: total >= 80 ? 'Urgent' : total >= 60 ? 'High' : total >= 40 ? 'Medium' : 'Low' }
}
