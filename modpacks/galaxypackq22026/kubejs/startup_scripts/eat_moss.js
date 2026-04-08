// kubejs/server_scripts/eat_moss.js

function mossEffect(item) {
  item.setFoodProperties((food) => {
    food.hunger(2);
    food.saturation(0.2);
    food.alwaysEdible();
    // poison for 0.5 seconds with an amplifier of 1 and a 50% chance to apply
    food.effect("minecraft:poison", 0.5, 1, 0.5);
  });
}

ItemEvents.modification((event) => {
  event.modify("minecraft:moss_block", (item) => {
    mossEffect(item);
  });
  event.modify("minecraft:spore_blossom", (item) => {
    mossEffect(item);
  });
});
