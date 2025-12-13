package com.culturemap.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "plan_members", 
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"plan_id", "member_id"})
    },
    indexes = {
        @Index(name = "idx_plan_member_plan", columnList = "plan_id"),
        @Index(name = "idx_plan_member_member", columnList = "member_id")
    }
)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private Plan plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "VIEWER"; // OWNER, EDITOR, VIEWER

    @Column(name = "invited_at")
    private LocalDateTime invitedAt;

    @PrePersist
    protected void onCreate() {
        invitedAt = LocalDateTime.now();
    }
}
