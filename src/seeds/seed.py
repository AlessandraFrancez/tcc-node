import json
import sys
import os
sys.path.append('.')
from mongodb.utils import *
from constants import MONGODB_CONFIG

# populateDB = Uses seed in a json file to populate DB
# jsonfile: File name, must be located in the same folder
# collection: Collection in which the seed will be insert
# Identifier: Unique parameter in the document used to verify whether the entry is repeated
def populateDB(jsonfile, collection, identifier):
    counter, repeat = 0, 0
    print(f"Iniciando populate da {collection}")
    with open((os.path.join(sys.path[0],jsonfile)), encoding='utf-8') as seed:
        data = json.load(seed)
        for item in data:
            repeat += SaveDocument(item,collection,identifier)
            counter += 1
        print(f"Número de entradas: {counter}")
        print(f"Valores repetidos: {repeat}")
        seed.close()

populateDB("config_seed.json",MONGODB_CONFIG,"query")
populateDB("dict_seed.json",MONGODB_DICTIONARY,"word")