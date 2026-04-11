Change log
## 1.0.0
- Started noting changes 
- Removed the Vanilla crafting recipe of regions_unexplored:raw_redstone_block (raw redstone block) craftable with 4 redstone dust 
    - This resulted in an infinite redstone duplication within the the mekanism:*_enriching_factory and the mekanism:enrichment_chamber blocks.
        - the raw redstone block had the forge:ores/redstone tag, causing it to be treated the same as vanilla ore (extracting 12 redstone instead of 4 from the block)