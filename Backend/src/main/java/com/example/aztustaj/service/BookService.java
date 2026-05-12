package com.example.aztustaj.service;

import com.example.aztustaj.entity.Book;

import java.util.List;

public interface BookService {
    List<Book> getAllBooks(String search, String category, String sort);

    Book saveBook(Book book);

    Book getBookById(String id);

    List<Book> getAllBooks();

    void deleteBook(String id);

    Book updateBook(String id, Book book);
}
