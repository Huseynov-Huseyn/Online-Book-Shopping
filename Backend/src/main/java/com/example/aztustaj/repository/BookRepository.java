package com.example.aztustaj.repository;

import com.example.aztustaj.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, String> {

    // Başlığa və ya müəllifə görə axtarış
    List<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(String title, String author);

    // Kateqoriyaya görə
    List<Book> findByCategoryIgnoreCase(String category);

    // Başlıq və kateqoriya kombinasiyası
    List<Book> findByTitleContainingIgnoreCaseAndCategoryIgnoreCase(String title, String category);

    // Müəllif və kateqoriya kombinasiyası
    List<Book> findByAuthorContainingIgnoreCaseAndCategoryIgnoreCase(String author, String category);

    // Axtarış + Kateqoriya
    @Query("SELECT b FROM Book b WHERE " +
            "(LOWER(b.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(b.author) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
            "(:category IS NULL OR LOWER(b.category) = LOWER(:category))")
    List<Book> searchBooks(@Param("search") String search, @Param("category") String category);

    // Bütün təkrar olunmayan kateqoriyaları gətir
    @Query("SELECT DISTINCT b.category FROM Book b WHERE b.category IS NOT NULL AND b.category != ''")
    List<String> findDistinctCategories();
}
