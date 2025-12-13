package com.culturemap.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "histories", indexes = {
    @Index(name = "idx_history_member", columnList = "member_id"),
    @Index(name = "idx_history_order", columnList = "member_id,display_order")
})
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class History {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "event_date")
    private LocalDate eventDate; // 공연 관람 날짜

    @Column(name = "location", length = 200)
    private String location; // 공연 장소

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder; // 표시 순서

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
