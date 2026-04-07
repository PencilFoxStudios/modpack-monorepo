ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event

  event.register(
    Commands.literal('setsize')
      .then(
        Commands.argument('size', Arguments.FLOAT.create(event))
          .executes(ctx => {
            const player = ctx.source.player
            const size = Arguments.FLOAT.getResult(ctx, 'size')

            // restrict size to a reasonable range (0.7 to 2.0)
            if (size < 0.6 || size > 2.0) {
                player.displayClientMessage(
                Component.red("Size must be between 0.7 and 2.0"),
                true
              )
              return 1;
            }

            // Run Pehkui command as server
            ctx.source.server.runCommandSilent(
              `scale set pehkui:base ${size} ${player.username}`
            )

            player.displayClientMessage(
              Component.green(`Size set to ${size}`),
              true
            )

            return 1
          })
      )
  )
})