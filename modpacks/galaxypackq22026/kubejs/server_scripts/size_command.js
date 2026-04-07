ServerEvents.commandRegistry(event => {
    // Create a new command called /setsize [size (0.7-2.0)]
    event.register('setsize', (args, player) => {
        // // Get the size argument as a number
        // const size = parseFloat(args[0])
        // // Check if the size is valid
        // if (isNaN(size) || size < 0.7 || size > 2.0) {
        //     player.tell('Please provide a valid size between 0.7 and 2.0')
        //     return
        // }
        // // Set the player's size using Pehkui's API
        // event.server.runCommand
        // player.tell(`Your size has been set to ${size}`)
    }
    )
})