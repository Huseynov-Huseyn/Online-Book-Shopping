package com.example.aztustaj.service;

import com.example.aztustaj.entity.Book;
import com.example.aztustaj.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookServiceImpl implements BookService {

    private final BookRepository bookRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Book> getAllBooks(String search, String category, String sort) {
        List<Book> books;

        // Axtarış və filtrasiya
        if (search != null && !search.isEmpty() && category != null && !category.isEmpty() && !category.equals("all")) {
            books = bookRepository.searchBooks(search, category);
        } else if (search != null && !search.isEmpty()) {
            books = bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(search, search);
        } else if (category != null && !category.isEmpty() && !category.equals("all")) {
            books = bookRepository.findByCategoryIgnoreCase(category);
        } else {
            books = bookRepository.findAll();
        }

        // Sıralama
        if (sort != null && !sort.isEmpty()) {
            books = applySorting(books, sort);
        }

        return books;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    @Override
    @Transactional
    public Book saveBook(Book book) {
        // Kitab null yoxlaması
        if (book == null) {
            throw new IllegalArgumentException("Kitab null ola bilməz");
        }

        // ID null olarsa, yeni ID yarad
        if (book.getId() == null || book.getId().isEmpty()) {
            book.setId(System.nanoTime() + "");
        }

        return bookRepository.save(book);
    }

    @Override
    @Transactional(readOnly = true)
    public Book getBookById(String id) {
        return bookRepository.findById(id).orElse(null);
    }

    @Override
    @Transactional
    public void deleteBook(String id) {
        bookRepository.deleteById(id);
    }

    @Override
    @Transactional
    public Book updateBook(String id, Book book) {
        Book existingBook = bookRepository.findById(id).orElse(null);
        if (existingBook != null) {
            existingBook.setTitle(book.getTitle() != null ? book.getTitle() : existingBook.getTitle());
            existingBook.setAuthor(book.getAuthor() != null ? book.getAuthor() : existingBook.getAuthor());
            existingBook.setCategory(book.getCategory() != null ? book.getCategory() : existingBook.getCategory());
            existingBook.setPages(book.getPages() > 0 ? book.getPages() : existingBook.getPages());
            existingBook.setYear(book.getYear() > 0 ? book.getYear() : existingBook.getYear());
            existingBook.setPrice(book.getPrice() != null && book.getPrice().signum() > 0 ? book.getPrice() : existingBook.getPrice());
            existingBook.setStockQuantity(book.getStockQuantity() >= 0 ? book.getStockQuantity() : existingBook.getStockQuantity());
            return bookRepository.save(existingBook);
        }
        return null;
    }

    private List<Book> applySorting(List<Book> books, String sort) {
        try {
            if (sort.contains("pages-asc")) {
                return books.stream()
                        .sorted(Comparator.comparingInt(Book::getPages))
                        .collect(Collectors.toList());
            } else if (sort.contains("pages-desc")) {
                return books.stream()
                        .sorted(Comparator.comparingInt(Book::getPages).reversed())
                        .collect(Collectors.toList());
            } else if (sort.contains("title-az")) {
                return books.stream()
                        .sorted(Comparator.comparing(Book::getTitle))
                        .collect(Collectors.toList());
            } else if (sort.contains("price-asc")) {
                return books.stream()
                        .sorted(Comparator.comparing(Book::getPrice))
                        .collect(Collectors.toList());
            } else if (sort.contains("price-desc")) {
                return books.stream()
                        .sorted(Comparator.comparing(Book::getPrice).reversed())
                        .collect(Collectors.toList());
            } else if (sort.contains("year-asc")) {
                return books.stream()
                        .sorted(Comparator.comparingInt(Book::getYear))
                        .collect(Collectors.toList());
            } else if (sort.contains("year-desc")) {
                return books.stream()
                        .sorted(Comparator.comparingInt(Book::getYear).reversed())
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            System.err.println("Sıralama xətası: " + e.getMessage());
        }
        return books;
    }
}