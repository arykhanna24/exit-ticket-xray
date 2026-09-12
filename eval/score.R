# score.R — AK owns this. Base R only, no packages, no internet needed.
#
# Inputs (all in ../data or ./):
#   ground_truth.csv   student,true_group
#   responses.csv      student,answer          (for the baselines)
#   predicted.csv      student,predicted_group (from engine.js toEvalCsv)
#
# Output: the three numbers that go on the evidence slide.

gt   <- read.csv("../data/ground_truth.csv", stringsAsFactors = FALSE)
resp <- read.csv("../data/responses.csv",    stringsAsFactors = FALSE)
pred <- read.csv("predicted.csv",            stringsAsFactors = FALSE)

CORRECT_ANSWER <- "5/6"

# ---- Adjusted Rand Index, from the contingency table ----
ari <- function(a, b) {
  tab <- table(a, b)
  nij <- sum(choose(tab, 2))
  ai  <- sum(choose(rowSums(tab), 2))
  bj  <- sum(choose(colSums(tab), 2))
  n   <- choose(length(a), 2)
  expected <- ai * bj / n
  maxi     <- (ai + bj) / 2
  (nij - expected) / (maxi - expected)
}

# ---- Assignment accuracy under optimal label matching ----
# Our group ids and the ground-truth ids are different strings for the same
# thing, so map each predicted group to the true group it overlaps most, then
# count students landing in the right place. Greedy is fine at this size.
accuracy <- function(truth, predicted) {
  tab <- table(predicted, truth)
  hits <- 0
  used <- character(0)
  for (p in rownames(tab)[order(-rowSums(tab))]) {
    avail <- setdiff(colnames(tab), used)
    if (!length(avail)) next
    best <- avail[which.max(tab[p, avail])]
    hits <- hits + tab[p, best]
    used <- c(used, best)
  }
  hits / length(truth)
}

# ---- Baseline 1: score-sorting. One undifferentiated "needs help" pile. ----
base_score <- ifelse(resp$answer == CORRECT_ANSWER, "correct", "needs_help")

# ---- Baseline 2: answer-string grouping. The steelman. ----
base_string <- ifelse(resp$answer == CORRECT_ANSWER, "correct", resp$answer)

# ---- Align everything to one student order ----
ord    <- gt$student
truth  <- gt$true_group[match(ord, gt$student)]
ours   <- pred$predicted_group[match(ord, pred$student)]
b1     <- base_score[match(ord, resp$student)]
b2     <- base_string[match(ord, resp$student)]

stopifnot(!any(is.na(ours)))  # every student must be classified

n <- length(ord)
report <- function(name, p) {
  cat(sprintf("%-16s  %2d/%d correct (%.0f%%)   ARI %.2f   groups %d\n",
              name, round(accuracy(truth, p) * n), n,
              accuracy(truth, p) * 100, ari(truth, p),
              length(unique(p))))
}

cat("\nSTUDENT ASSIGNMENT ACCURACY vs ground truth\n")
cat(strrep("-", 64), "\n")
report("Score-sorting",  b1)
report("Answer-string",  b2)
report("Ours",           ours)
cat(strrep("-", 64), "\n")
cat("True groups:", length(unique(truth)), "\n\n")
