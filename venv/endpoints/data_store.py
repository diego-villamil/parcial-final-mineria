# data_store.py
import pandas as pd

# Variable global para almacenar el DataFrame
_data_frame = None

def save_dataframe(df: pd.DataFrame):
    """Guarda el DataFrame en una variable global."""
    global _data_frame
    _data_frame = df

def get_dataframe() -> pd.DataFrame:
    """Recupera el DataFrame guardado."""
    return _data_frame
