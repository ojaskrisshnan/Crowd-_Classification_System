import argparse
import os
from typing import Optional

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import (
    auc,
    precision_score,
    recall_score,
    f1_score,
    roc_curve,
)


def load_data(csv_path: str) -> pd.DataFrame:
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found: {csv_path}")
    df = pd.read_csv(csv_path)
    required_cols = {"actual_count", "predicted_count"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns in CSV: {missing}")
    return df


def person_detection_accuracy(df: pd.DataFrame) -> Optional[float]:
    if not {"correct_detections", "total_persons"}.issubset(df.columns):
        return None
    correct = df["correct_detections"].sum()
    total = df["total_persons"].sum()
    if total == 0:
        return None
    return float(correct / total * 100.0)


def people_counting_accuracy(df: pd.DataFrame) -> float:
    actual = df["actual_count"].to_numpy(dtype=float)
    pred = df["predicted_count"].to_numpy(dtype=float)
    mask = actual > 0
    if not np.any(mask):
        return 0.0
    abs_err = np.abs(pred[mask] - actual[mask])
    per_frame_acc = 1.0 - abs_err / actual[mask]
    return float(np.clip(per_frame_acc, 0.0, 1.0).mean() * 100.0)


def people_counting_mae(df: pd.DataFrame) -> float:
    actual = df["actual_count"].to_numpy(dtype=float)
    pred = df["predicted_count"].to_numpy(dtype=float)
    return float(np.abs(pred - actual).mean())


def density_accuracy(df: pd.DataFrame) -> Optional[float]:
    if not {"actual_density", "predicted_density"}.issubset(df.columns):
        return None
    actual = df["actual_density"].astype(str)
    pred = df["predicted_density"].astype(str)
    if len(actual) == 0:
        return None
    return float((actual == pred).mean() * 100.0)


def processing_time_per_frame(df: pd.DataFrame) -> Optional[float]:
    if "frame_time" not in df.columns:
        return None
    times = df["frame_time"].to_numpy(dtype=float)
    if len(times) == 0:
        return None
    return float(times.mean())


def add_crowded_columns(df: pd.DataFrame) -> pd.DataFrame:
    if "crowded_gt" not in df.columns:
        if "actual_density" in df.columns:
            crowded_labels = df["actual_density"].astype(str).str.lower()
            df["crowded_gt"] = crowded_labels.isin(["crowded", "jam-packed", "jampacked"])
        else:
            df["crowded_gt"] = df["actual_count"].to_numpy(dtype=float) >= 15.0
    if "crowded_score" not in df.columns:
        df["crowded_score"] = df["predicted_count"].to_numpy(dtype=float)
    return df


def roc_and_pr_metrics(df: pd.DataFrame, roc_path: Optional[str] = None) -> dict:
    df = add_crowded_columns(df)
    y_true = df["crowded_gt"].astype(int).to_numpy()
    y_score = df["crowded_score"].to_numpy(dtype=float)

    fpr, tpr, _ = roc_curve(y_true, y_score)
    roc_auc = auc(fpr, tpr)

    # choose a threshold at 15 people for binary crowded vs non-crowded
    y_pred = (y_score >= 15.0).astype(int)
    precision = precision_score(y_true, y_pred)
    recall = recall_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred)

    if roc_path:
        plt.figure(figsize=(5, 4))
        plt.plot(fpr, tpr, color="darkorange", lw=2, label=f"ROC (AUC = {roc_auc:.2f})")
        plt.plot([0, 1], [0, 1], color="navy", lw=1, linestyle="--")
        plt.xlabel("False Positive Rate")
        plt.ylabel("True Positive Rate (Recall)")
        plt.title("ROC Curve: Crowded vs Non-Crowded")
        plt.legend(loc="lower right")
        plt.grid(alpha=0.3)
        plt.tight_layout()
        plt.savefig(roc_path, dpi=200)
        plt.close()

    return {
        "roc_auc": float(roc_auc),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate crowd density system metrics.")
    parser.add_argument(
        "--csv",
        required=True,
        help=(
            "Path to CSV file with per-frame results. "
            "Required columns: actual_count, predicted_count. "
            "Optional: correct_detections, total_persons, "
            "actual_density, predicted_density, frame_time, "
            "crowded_gt, crowded_score."
        ),
    )
    parser.add_argument(
        "--roc-output",
        default="roc_curve.png",
        help="Path to save ROC curve image (PNG).",
    )
    args = parser.parse_args()

    df = load_data(args.csv)

    print("=== Evaluation Metrics ===")

    det_acc = person_detection_accuracy(df)
    if det_acc is not None:
        print(f"Person Detection Accuracy     : {det_acc:.2f}% "
              "(Correct detections / Total persons × 100)")
    else:
        print("Person Detection Accuracy     : N/A (columns missing)")

    count_acc = people_counting_accuracy(df)
    mae = people_counting_mae(df)
    print(f"People Counting Accuracy      : {count_acc:.2f}% "
          "(1 - |actual - pred| / actual, averaged)")
    print(f"People Counting MAE           : {mae:.3f} people")

    dens_acc = density_accuracy(df)
    if dens_acc is not None:
        print(f"Crowd Density Class Accuracy  : {dens_acc:.2f}% "
              "(Correctly classified frames / Total frames × 100)")
    else:
        print("Crowd Density Class Accuracy  : N/A (columns missing)")

    avg_time = processing_time_per_frame(df)
    if avg_time is not None:
        print(f"Avg Processing Time / Frame   : {avg_time:.4f} s")
    else:
        print("Avg Processing Time / Frame   : N/A (frame_time column missing)")

    pr_metrics = roc_and_pr_metrics(df, roc_path=args.roc_output)
    print(f"ROC AUC (Crowded vs Non)      : {pr_metrics['roc_auc']:.3f}")
    print(f"Precision (Crowded)           : {pr_metrics['precision']:.3f}")
    print(f"Recall (Crowded)              : {pr_metrics['recall']:.3f}")
    print(f"F1-score (Crowded)            : {pr_metrics['f1']:.3f}")
    print(f"ROC curve saved to            : {os.path.abspath(args.roc_output)}")


if __name__ == "__main__":
    main()

