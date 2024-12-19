export const formatTime = (date: string | undefined) => {
    if (date) {
      const hours = new Date(date)?.getHours()
      const minutes = new Date(date)?.getMinutes()
      const period = hours >= 12 ? "PM" : "AM"
      const formattedHours = hours % 12 || 12

      return `${formattedHours}:${minutes ? `${minutes} ${period}` : period}`
    }
  }