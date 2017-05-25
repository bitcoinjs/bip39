#!/usr/bin/env python2
#Generate list of words based in a dictionary, following BIP0039:
#   -a)smart selection (the wordlist is created in such way that it's enough to type the first four
#letters to unambiguously identify the word)
#   -b) similar words avoided (using levenshtein distance >= 3)
#   -c) sorted

import re, sys, fileinput, random

def levenshtein(s1, s2):
    if len(s1) < len(s2):
        return levenshtein(s2, s1)
 
    # len(s1) >= len(s2)
    if len(s2) == 0:
        return len(s1)
 
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1 # j+1 instead of j since previous_row and current_row are one character longer
            deletions = current_row[j] + 1       # than s2
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
 
    return previous_row[-1]

words = []
prefixes = []

for line in fileinput.input():
    word = line.decode('iso-8859-1').encode('utf-8').split('/')[0].split('\n')[0]
    if not word.isdigit() and len(word) >= 4 and word[0].islower() and not word[:4] in prefixes:
        words+= [word]
        prefixes+= [word[:4]]

correctWords = []

for w in words:
    sys.stdout.write('\r{}/{}'.format(len(correctWords), len(words)))
    sys.stdout.flush()
    correctWords += [w]
    for i in xrange(len(correctWords+1, len(words)):
        if levenshtein(w, words[i]) <= 2:
            words.remove(words[i])

correctWords = random.sample(correctWords, 2048)
correctWords.sort()
ptjson = open('pt.json', 'w')
ptjson.write('[\n')
for word in correctWords[:-1]:
    ptjson.write('  "{}",\n'.format(word))
ptjson.write('  "{}"\n]\n'.format(correctWords[-1]))
ptjson.close()
