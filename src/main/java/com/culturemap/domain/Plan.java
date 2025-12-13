package com.culturemap.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "plans", indexes = {
    @Index(name = "idx_plan_member", columnList = "member_id"),
    @Index(name = "idx_plan_date", columnList = "plan_date"),
    @Index(name = "idx_plan_member_date", columnList = "member_id,plan_date")
})
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "plan_date", nullable = false)
    private LocalDate planDate;

    @Column(length = 200)
    private String title;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PlanPlace> planPlaces = new ArrayList<>();

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PlanMember> planMembers = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void addPlanPlace(PlanPlace planPlace) {
        planPlaces.add(planPlace);
        planPlace.setPlan(this);
    }

    public void updatePlanDate(LocalDate planDate) {
        this.planDate = planDate;
    }

    public void updateTitle(String title) {
        this.title = title;
    }
}

