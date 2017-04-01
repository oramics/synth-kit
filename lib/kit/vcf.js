// # Voltage Controlled Filter
import Filter from "./filter"

/**
 * Create a VCF
 */
export default function VCF (ac, config) {
  const filter = Filter(ac, config)
  return filter
}
