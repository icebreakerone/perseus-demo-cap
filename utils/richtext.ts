export const parseRichText = (input: string) => {
  const regexWebsites =
    /((https?:\/\/)|(www\.))[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/gi

  // const regexEmails = /^mailto[^\s]+$/
  const regexEmails = /mailto:[^\s]+/gi

  const textWithWebsites = input.replace(regexWebsites, (url: string) => {
    const href = url.startsWith('http') ? url : 'http://' + url
    return `<a class="text-blue-500" href="${href}" target="_blank" rel="no?r noreferrer">${url}</a>`
  })

  const textWithEmails = textWithWebsites.replace(
    regexEmails,
    (str: string) => {
      const email = str.slice(7, str.length)
      return `<a class="text-blue-500" href="${str}" target="_blank" rel="noopener noreferrer">${email}</a>`
    },
  )

  return textWithEmails
}
