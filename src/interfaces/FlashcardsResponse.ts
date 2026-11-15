interface Flashcard {
  front: string;
  back: string;
}

export interface FlashcardsResponse {
  title?: string;
  flashcards: Flashcard[];
}
