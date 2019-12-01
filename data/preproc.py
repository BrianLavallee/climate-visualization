
import sys

data = []
name = "e140n40"

with open("oldmaps/" + name + ".dem", "rb") as fr:
    while True:
        a = fr.read(1)
        b = fr.read(1)
        if not a or not b:
            break

        data.append((int.from_bytes(a, "big", signed=True) << 8) + int.from_bytes(b, "big", signed=True))
        # data.append(int.from_bytes(a, "big", signed=True))

dsdata = []
for row in range(0, 6000, 5):
    for col in range(0, 4800, 5):
        val = data[row * 4800 + col]
        for i in range(5):
            for j in range(5):
                index = (row + i) * 4800 + col + j
                val = max(val, data[index])

        dsdata.append(val)

with open("maps/" + name + ".dem", "wb") as fw:
    for i in dsdata:
        ba = bytearray(i.to_bytes(2, sys.byteorder, signed=True))
        fw.write(ba)
