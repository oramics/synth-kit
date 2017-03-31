import Filter from "./filter"

/**
 * Voltage Controlled Filter
 */
export default function VCF (ac, state, envState) {
  if (!envState) envState = state
  const filter = Filter(ac, state)
  // filter.envelope = FilterEnvelope(state)
  // filter.trigger = filter.envelope.trigger
  filter.trigger = () => {
    // TODO
  }
  console.log("FILTER", filter, filter.state)
  return filter
}
