;; Consumer Identity Contract
;; Manages shopper profiles

(define-data-var admin principal tx-sender)

;; Map to store consumer profiles
(define-map consumer-profiles principal
  {
    username: (string-utf8 50),
    registration-date: uint,
    preferences-shared: bool
  }
)

;; Map to store consumer consent for data sharing
(define-map data-sharing-consent principal
  {
    transaction-data: bool,
    preference-data: bool,
    last-updated: uint
  }
)

;; Public function for consumers to register
(define-public (register-consumer (username (string-utf8 50)))
  (ok (map-set consumer-profiles tx-sender
    {
      username: username,
      registration-date: block-height,
      preferences-shared: false
    }
  ))
)

;; Public function for consumers to update their data sharing preferences
(define-public (update-data-sharing-consent (transaction-consent bool) (preference-consent bool))
  (ok (map-set data-sharing-consent tx-sender
    {
      transaction-data: transaction-consent,
      preference-data: preference-consent,
      last-updated: block-height
    }
  ))
)

;; Read-only function to check if a consumer exists
(define-read-only (consumer-exists (consumer principal))
  (is-some (map-get? consumer-profiles consumer))
)

;; Read-only function to get consumer profile
(define-read-only (get-consumer-profile (consumer principal))
  (map-get? consumer-profiles consumer)
)

;; Read-only function to get consumer consent
(define-read-only (get-consumer-consent (consumer principal))
  (default-to
    {
      transaction-data: false,
      preference-data: false,
      last-updated: u0
    }
    (map-get? data-sharing-consent consumer)
  )
)

;; Function to mark consumer as having shared preferences
(define-public (mark-preferences-shared (consumer principal))
  (let ((profile (unwrap! (map-get? consumer-profiles consumer) (err u2))))
    (begin
      (asserts! (or (is-eq tx-sender (var-get admin)) (is-eq tx-sender consumer)) (err u1))
      (ok (map-set consumer-profiles consumer
        (merge profile { preferences-shared: true })
      ))
    )
  )
)
