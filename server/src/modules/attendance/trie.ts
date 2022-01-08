export type Trie = {
  [key: string]: string | Trie
}

export const addToTrie =
(trie: Trie, remainingToAdd: string, pointsTo: string): Trie => {
  if (remainingToAdd === '') {
    trie[ '**' ] = pointsTo;
    return trie;
  }
  const firstChar = remainingToAdd[ 0 ];
  if (!trie[ firstChar ]) {
    trie[ firstChar ] = {};
  }

  addToTrie(trie[ firstChar ] as Trie, remainingToAdd.substring(1), pointsTo);
  return trie;
};

export const findInTrie = (trie: Trie, key: string): null | string => {
  while(key.length > 0) {
    const firstChar = key[ 0 ];

    if (trie[ firstChar ]) {
      trie = trie[ firstChar ] as Trie;
    }
    else {
      return null;
    }

    key = key.substring(1);
  }

  if (trie[ '**' ]) return trie[ '**' ] as string;
  return null;
};
