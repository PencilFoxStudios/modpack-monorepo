// ForgeEvents.onEvent(
//   "net.minecraftforge.client.event.sound.SoundEvent",
//   (event) => {
//     global.SoundEvent(event);
//   },
// );
StartupEvents.registry("sound_event", (event) => {
  event.create("siren");
event.create("space_asshole");
});
// let sirenActive = false;
// global.SoundEvent = (event) => {
//   if (Client.player != null) {
//     let sound = event.getSound();
//     if (sound) {
//       let location = sound.location.toString();
//       if (location == "weather2:streaming.siren") {
//         // get location of sound
//         let x = sound.getX();
//         let y = sound.getY();
//         let z = sound.getZ();
//         console.log("Siren sound detected at " + x + ", " + y + ", " + z);
//         if (!sirenActive) {
//           sirenActive = true;
//           Client.player.tell(
//             "Siren is not active, playing custom sound and setting sirenActive to true.",
//           );

//           Client.level.playLocalSound(
//             x,
//             y,
//             z,
//             "kubejs:siren",
//             "neutral",
//             2.0,
//             1.0,
//             true
//           );
//           // after 96 seconds, set sirenActive to false
//           Client.schedule(96000, () => {
//             sirenActive = false;
//           });
//         } else {
//           Client.player.tell(
//             "Siren is already active, not playing custom sound.",
//           );
//         }
//       }
//     }
//   }
// };
