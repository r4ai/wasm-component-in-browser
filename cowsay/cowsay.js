export const cow = {
  say(text, cow = "default") {
    switch (cow) {
      case "default":
        return `${text}
  \\   ^__^
    \\  (oo)\\______
      (__)\\      )\/\\
          ||----w |
          ||     ||
`
      case "owl":
        return `${text}
   ___
  (o o)
 (  V  )
/--m-m-
`
    }
  },
}
