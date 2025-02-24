import moment from "moment"

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

export const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

export const formatLastName = (lastName: string) => {
  return `${lastName?.[0]?.toUpperCase() || ''}.`
}

export const timeRounder = ({
  time,
  roundedTo,
}: {
  time: moment.Moment
  roundedTo: number
}) => {
  return time.minutes(Math.round(moment(time).minutes() / roundedTo) * 10)
}
