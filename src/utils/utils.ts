export const formatTime = (date: string | undefined) => {
  if (date) {
    const hours = new Date(date)?.getHours()
    const minutes = new Date(date)?.getMinutes()
    const period = hours >= 12 ? "PM" : "AM"
    const formattedHours = hours % 12 || 12

    return `${formattedHours}${
      minutes ? `:${minutes} ${period}` : ` ${period}`
    }`
  }
}

export const getCustomTimezoneDisplay = () => {
  const now = new Date()

  const currentTimezone = Intl.DateTimeFormat("en-US", {
    timeZoneName: "short",
  }).resolvedOptions().timeZone

  const offsetMinutes = now.getTimezoneOffset()
  const offsetHours = -(offsetMinutes / 60)
  const gmtOffset = `GMT ${offsetHours >= 0 ? "+" : ""}${offsetHours
    .toString()
    .padStart(2, "0")}:00`

  const cityName = currentTimezone

  return `(${gmtOffset}) ${cityName}`
}
