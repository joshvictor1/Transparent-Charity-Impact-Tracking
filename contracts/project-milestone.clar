;; Project Milestone Contract
;; Defines and tracks charitable objectives

;; Data Variables
(define-map projects
  { project-id: uint }
  {
    name: (string-ascii 100),
    description: (string-ascii 500),
    target-amount: uint,
    start-block: uint,
    end-block: (optional uint),
    status: (string-ascii 20) ;; "active", "completed", "cancelled"
  }
)

(define-map milestones
  { milestone-id: uint }
  {
    project-id: uint,
    description: (string-ascii 500),
    target-block: uint,
    completed: bool,
    completion-block: (optional uint)
  }
)

(define-data-var project-counter uint u0)
(define-data-var milestone-counter uint u0)

;; Project Management Functions
(define-public (create-project (name (string-ascii 100)) (description (string-ascii 500)) (target-amount uint))
  (let
    (
      (new-project-id (+ (var-get project-counter) u1))
    )
    ;; Update project counter
    (var-set project-counter new-project-id)

    ;; Create new project
    (map-set projects
      { project-id: new-project-id }
      {
        name: name,
        description: description,
        target-amount: target-amount,
        start-block: block-height,
        end-block: none,
        status: "active"
      }
    )

    ;; Return success with project ID
    (ok new-project-id)
  )
)

(define-public (add-milestone (project-id uint) (description (string-ascii 500)) (target-block uint))
  (let
    (
      (project (map-get? projects { project-id: project-id }))
      (new-milestone-id (+ (var-get milestone-counter) u1))
    )
    ;; Check if project exists
    (asserts! (is-some project) (err u1))

    ;; Update milestone counter
    (var-set milestone-counter new-milestone-id)

    ;; Create new milestone
    (map-set milestones
      { milestone-id: new-milestone-id }
      {
        project-id: project-id,
        description: description,
        target-block: target-block,
        completed: false,
        completion-block: none
      }
    )

    ;; Return success with milestone ID
    (ok new-milestone-id)
  )
)

(define-public (complete-milestone (milestone-id uint))
  (let
    (
      (milestone (unwrap! (map-get? milestones { milestone-id: milestone-id }) (err u1)))
      (project-id (get project-id milestone))
      (project (unwrap! (map-get? projects { project-id: project-id }) (err u2)))
    )
    ;; Check if milestone is not already completed
    (asserts! (not (get completed milestone)) (err u3))

    ;; Update milestone as completed
    (map-set milestones
      { milestone-id: milestone-id }
      (merge milestone {
        completed: true,
        completion-block: (some block-height)
      })
    )

    ;; Return success
    (ok true)
  )
)

;; Read-only Functions
(define-read-only (get-project (project-id uint))
  (map-get? projects { project-id: project-id })
)

(define-read-only (get-milestone (milestone-id uint))
  (map-get? milestones { milestone-id: milestone-id })
)

