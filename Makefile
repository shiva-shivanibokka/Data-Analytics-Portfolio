# Reproducible pipeline. `make all` takes a clean checkout to executed notebooks.
.PHONY: setup data build test lint notebooks web all clean

setup:            ## install the package + dev tools
	pip install -e ".[dev]"

data:             ## download the real Olist + Cookie Cats datasets
	python data/fetch_data.py

build: data       ## run the pipeline: raw -> validated curated parquet + web JSON
	python -m analytics.build

test:             ## run the test suite
	pytest -q

lint:             ## ruff lint
	ruff check src tests data

notebooks: build  ## execute all notebooks in place (embeds real outputs)
	jupyter nbconvert --to notebook --execute --inplace notebooks/*.ipynb

web:              ## run the Next.js dashboard locally
	cd web && npm install && npm run dev

all: setup build lint test notebooks  ## full reproducible run

clean:
	rm -rf data/raw data/processed .pytest_cache .ruff_cache
	find . -name __pycache__ -type d -prune -exec rm -rf {} +
