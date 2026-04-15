ServerEvents.recipes(event => {

event.remove({output: 'regions_unexplored:raw_redstone_block'})
event.shaped(
  Item.of('regions_unexplored:raw_redstone_block', 1),
  [
   '   ',
   ' A ',
   '   '
  ],
  {
   A: 'minecraft:barrier'
  }
)
}
)